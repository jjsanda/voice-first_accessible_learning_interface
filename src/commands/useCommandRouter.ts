import { useCallback, useEffect, useRef } from 'react';
import type { Intent } from '../types/commands';
import type { Lesson } from '../types/course';
import { answerQuestion } from '../answer/engineFactory';
import { useAppStore } from '../state/appStore';
import type { Route } from '../state/useHashRoute';

export interface CommandRouterDeps {
  route: Route;
  navigate: (route: Route) => void;
  speak: (text: string, options?: { onDone?: () => void }) => void;
  stopSpeaking: () => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  openHelp: () => void;
}

export interface CommandRouter {
  /** Executes an intent. Voice input and UI buttons both call this. */
  execute: (intent: Intent) => void;
  /** Runs the ask flow for a question (search → answer → speak). */
  ask: (question: string) => Promise<void>;
  /** Opens a lesson and reads it aloud from the given section. */
  readLesson: (lessonId: string, sectionIndex?: number) => void;
}

const MODE_ANNOUNCEMENTS: Record<string, string> = {
  home: 'Home.',
  ask: 'Ask a question. Press the microphone or type below.',
  lessons: 'Lessons.',
  quiz: 'Quiz.',
  settings: 'Settings.',
};

/**
 * The single place where intents turn into actions. Every intent produces
 * both a spoken confirmation and a visual announcement, so voice-first and
 * screen-reader users get the same feedback.
 */
export function useCommandRouter(deps: CommandRouterDeps): CommandRouter {
  const store = useAppStore();

  // The execute closure changes every render; keep a stable ref so speech
  // callbacks (like auto-advancing lesson reading) always see the latest.
  const selfRef = useRef<CommandRouter | null>(null);

  const { route, navigate, speak, stopSpeaking, pauseSpeaking, resumeSpeaking, openHelp } = deps;

  const say = useCallback(
    (text: string, options?: { onDone?: () => void }) => {
      store.dispatch({ type: 'ANNOUNCE', text });
      stopSpeaking();
      speak(text, options);
    },
    [store, speak, stopSpeaking],
  );

  const ask = useCallback(
    async (question: string) => {
      if (route.mode !== 'ask') navigate({ mode: 'ask' });
      store.dispatch({ type: 'ASK_PENDING' });
      store.dispatch({ type: 'ANNOUNCE', text: 'Looking for an answer…' });
      try {
        const results = store.searchIndex.search(question, 6);
        const answer = await answerQuestion(store.course, question, results);
        store.dispatch({
          type: 'ASK_ANSWERED',
          entry: { id: Date.now(), question, answer },
        });
        stopSpeaking();
        speak(answer.spokenText);
        store.dispatch({ type: 'ANNOUNCE', text: 'Answer ready.' });
      } catch {
        const message = 'Something went wrong while answering. Please try again.';
        store.dispatch({
          type: 'ASK_ANSWERED',
          entry: {
            id: Date.now(),
            question,
            answer: {
              text: message,
              spokenText: message,
              citations: [],
              engine: 'extractive',
              grounded: false,
            },
          },
        });
        // Failure must be audible too — an eyes-free user gets no other cue.
        store.dispatch({ type: 'ANNOUNCE', text: message, assertive: true });
        stopSpeaking();
        speak(message);
      }
    },
    [route.mode, navigate, store, speak, stopSpeaking],
  );

  const readLesson = useCallback(
    (lessonId: string, sectionIndex = 0) => {
      const lesson = store.course.lessons.find((l) => l.id === lessonId);
      if (!lesson) return;
      const section = lesson.sections[sectionIndex];
      if (!section) return;
      navigate({ mode: 'lessons', lessonId, sectionIndex });
      store.dispatch({ type: 'SET_SECTION', index: sectionIndex });
      const intro = `${lesson.title}. Section ${sectionIndex + 1} of ${lesson.sections.length}: ${section.title}.`;
      say(`${intro} ${section.content}`, {
        onDone: () => {
          // Auto-advance through the rest of the lesson while speech continues.
          if (sectionIndex + 1 < lesson.sections.length) {
            selfRef.current?.readLesson(lessonId, sectionIndex + 1);
          } else {
            say('End of lesson.');
          }
        },
      });
    },
    [store, navigate, say],
  );

  const resolveLessonRef = useCallback(
    (ref: string | undefined): Lesson | undefined => {
      const { lessons } = store.course;
      if (ref === undefined) {
        return lessons.find((l) => l.id === route.lessonId) ?? lessons[0];
      }
      const byNumber = Number.parseInt(ref, 10);
      if (Number.isFinite(byNumber) && byNumber >= 1 && byNumber <= lessons.length) {
        return lessons[byNumber - 1];
      }
      const needle = ref.toLowerCase();
      return lessons.find((l) => l.title.toLowerCase().includes(needle));
    },
    [store, route.lessonId],
  );

  const execute = useCallback(
    (intent: Intent) => {
      const { state, dispatch, cardById, gradeCurrentCard, startQuizSession } = store;
      const { quiz } = state;
      const currentCard = quiz.queueIds[quiz.index]
        ? cardById(quiz.queueIds[quiz.index]!)
        : undefined;

      const speakCardFront = (index: number, queueIds: string[], gradedNow = false) => {
        const card = queueIds[index] ? cardById(queueIds[index]) : undefined;
        if (card) {
          say(`Card ${index + 1} of ${queueIds.length}. ${card.front}`);
        } else {
          // The grade that just happened isn't in state yet; count it only
          // when this was reached by grading (skipping doesn't review a card).
          const reviewed = store.state.quiz.stats.reviewed + (gradedNow ? 1 : 0);
          say(
            `Session complete. You reviewed ${reviewed} ${reviewed === 1 ? 'card' : 'cards'}. Say "go to quiz" to start again.`,
          );
        }
      };

      switch (intent.type) {
        case 'GO_TO': {
          navigate(intent.target === 'lessons' ? { mode: 'lessons' } : { mode: intent.target });
          if (intent.target === 'quiz') {
            const queue = startQuizSession();
            const first = queue[0];
            if (first) {
              say(`Quiz started. ${queue.length} cards to review. Card 1: ${first.front}`);
            } else {
              say('No cards are due right now. Well done! Check back later.');
            }
          } else {
            say(MODE_ANNOUNCEMENTS[intent.target] ?? intent.target);
          }
          break;
        }
        case 'ASK_QUESTION':
          void ask(intent.question);
          break;
        case 'READ_LESSON': {
          const lesson = resolveLessonRef(intent.lessonRef);
          if (lesson) {
            readLesson(lesson.id);
          } else {
            say(`I couldn't find a lesson matching "${intent.lessonRef ?? ''}".`);
          }
          break;
        }
        case 'NEXT': {
          if (route.mode === 'quiz') {
            if (!currentCard) break;
            dispatch({ type: 'QUIZ_SKIP' });
            speakCardFront(quiz.index + 1, quiz.queueIds);
          } else if (route.mode === 'lessons' && route.lessonId) {
            const lesson = store.course.lessons.find((l) => l.id === route.lessonId);
            if (lesson && state.sectionIndex + 1 < lesson.sections.length) {
              readLesson(lesson.id, state.sectionIndex + 1);
            } else {
              say('This is the last section of the lesson.');
            }
          }
          break;
        }
        case 'PREVIOUS': {
          if (route.mode === 'lessons' && route.lessonId) {
            const lesson = store.course.lessons.find((l) => l.id === route.lessonId);
            if (lesson && state.sectionIndex > 0) {
              readLesson(lesson.id, state.sectionIndex - 1);
            } else {
              say('This is the first section of the lesson.');
            }
          }
          break;
        }
        case 'FLIP': {
          if (route.mode !== 'quiz' || !currentCard) break;
          dispatch({ type: 'QUIZ_FLIP' });
          say(currentCard.back);
          break;
        }
        case 'MARK_RIGHT':
        case 'MARK_WRONG': {
          if (route.mode !== 'quiz' || !currentCard) break;
          const correct = intent.type === 'MARK_RIGHT';
          gradeCurrentCard(currentCard, correct);
          say(correct ? 'Marked correct.' : "Marked wrong. It'll come back soon.", {
            onDone: () => speakCardFront(quiz.index + 1, quiz.queueIds, true),
          });
          break;
        }
        case 'REPEAT': {
          if (route.mode === 'quiz' && currentCard) {
            say(quiz.revealed ? currentCard.back : currentCard.front);
          } else if (route.mode === 'lessons' && route.lessonId) {
            readLesson(route.lessonId, state.sectionIndex);
          } else if (route.mode === 'ask') {
            const last = state.askHistory[0];
            if (last) say(last.answer.spokenText);
          }
          break;
        }
        case 'PAUSE':
          pauseSpeaking();
          dispatch({ type: 'ANNOUNCE', text: 'Paused.' });
          break;
        case 'RESUME':
          resumeSpeaking();
          dispatch({ type: 'ANNOUNCE', text: 'Resumed.' });
          break;
        case 'STOP_SPEAKING':
          stopSpeaking();
          dispatch({ type: 'ANNOUNCE', text: 'Stopped.' });
          break;
        case 'HELP':
          openHelp();
          say('Here are the commands you can say.');
          break;
        case 'UNRECOGNIZED': {
          const heard = intent.transcript ? `I heard: "${intent.transcript}". ` : '';
          say(`${heard}I didn't catch a command. Say "help" to hear what you can say.`);
          break;
        }
      }
    },
    [
      store,
      route,
      navigate,
      say,
      ask,
      readLesson,
      resolveLessonRef,
      pauseSpeaking,
      resumeSpeaking,
      stopSpeaking,
      openHelp,
    ],
  );

  const router: CommandRouter = { execute, ask, readLesson };
  useEffect(() => {
    selfRef.current = router;
  });

  return router;
}
