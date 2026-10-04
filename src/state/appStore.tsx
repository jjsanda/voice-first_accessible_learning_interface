import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type { Answer } from '../types/answer';
import type { Course, Flashcard } from '../types/course';
import { buildIndex, type SearchIndex } from '../retrieval/bm25';
import { chunkCourse } from '../retrieval/chunker';
import { loadProgress, saveProgress } from '../srs/progressStore';
import {
  buildQueue,
  emptyStats,
  gradeCard,
  initialProgress,
  recordGrade,
  type SessionStats,
} from '../srs/scheduler';

export interface AskEntry {
  id: number;
  question: string;
  answer: Answer;
}

export interface QuizState {
  queueIds: string[];
  index: number;
  revealed: boolean;
  stats: SessionStats;
  /** True once a session has been started (distinguishes "not started" from "finished"). */
  started: boolean;
}

export interface AppState {
  sectionIndex: number;
  quiz: QuizState;
  askStatus: 'idle' | 'thinking';
  askHistory: AskEntry[];
  announcement: { text: string; assertive: boolean; nonce: number } | null;
}

export type AppAction =
  | { type: 'SET_SECTION'; index: number }
  | { type: 'QUIZ_START'; queueIds: string[] }
  | { type: 'QUIZ_FLIP' }
  | { type: 'QUIZ_GRADE'; correct: boolean }
  | { type: 'QUIZ_SKIP' }
  | { type: 'ASK_PENDING' }
  | { type: 'ASK_ANSWERED'; entry: AskEntry }
  | { type: 'ANNOUNCE'; text: string; assertive?: boolean };

const initialState: AppState = {
  sectionIndex: 0,
  quiz: { queueIds: [], index: 0, revealed: false, stats: emptyStats(), started: false },
  askStatus: 'idle',
  askHistory: [],
  announcement: null,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SECTION':
      return { ...state, sectionIndex: Math.max(0, action.index) };
    case 'QUIZ_START':
      return {
        ...state,
        quiz: {
          queueIds: action.queueIds,
          index: 0,
          revealed: false,
          stats: emptyStats(),
          started: true,
        },
      };
    case 'QUIZ_FLIP':
      return { ...state, quiz: { ...state.quiz, revealed: true } };
    case 'QUIZ_GRADE':
      return {
        ...state,
        quiz: {
          ...state.quiz,
          index: state.quiz.index + 1,
          revealed: false,
          stats: recordGrade(state.quiz.stats, action.correct),
        },
      };
    case 'QUIZ_SKIP':
      return { ...state, quiz: { ...state.quiz, index: state.quiz.index + 1, revealed: false } };
    case 'ASK_PENDING':
      return { ...state, askStatus: 'thinking' };
    case 'ASK_ANSWERED':
      return { ...state, askStatus: 'idle', askHistory: [action.entry, ...state.askHistory] };
    case 'ANNOUNCE':
      return {
        ...state,
        announcement: {
          text: action.text,
          assertive: action.assertive ?? false,
          nonce: (state.announcement?.nonce ?? 0) + 1,
        },
      };
    default:
      return state;
  }
}

export interface AppStore {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  course: Course;
  searchIndex: SearchIndex;
  /** Grades the current quiz card and persists spaced-repetition progress. */
  gradeCurrentCard: (card: Flashcard, correct: boolean) => void;
  startQuizSession: () => Flashcard[];
  cardById: (id: string) => Flashcard | undefined;
}

const AppStoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ course, children }: { course: Course; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const searchIndex = useMemo(() => buildIndex(chunkCourse(course)), [course]);
  const cardsById = useMemo(
    () => new Map(course.flashcards.map((card) => [card.id, card])),
    [course],
  );

  const store = useMemo<AppStore>(() => {
    const gradeCurrentCard = (card: Flashcard, correct: boolean) => {
      const progress = loadProgress();
      const current = progress.get(card.id) ?? initialProgress(card.id, Date.now());
      progress.set(card.id, gradeCard(current, correct, Date.now()));
      saveProgress(progress);
      dispatch({ type: 'QUIZ_GRADE', correct });
    };

    const startQuizSession = (): Flashcard[] => {
      const queue = buildQueue(course.flashcards, loadProgress(), Date.now());
      dispatch({ type: 'QUIZ_START', queueIds: queue.map((c) => c.id) });
      return queue;
    };

    return {
      state,
      dispatch,
      course,
      searchIndex,
      gradeCurrentCard,
      startQuizSession,
      cardById: (id) => cardsById.get(id),
    };
  }, [state, course, searchIndex, cardsById]);

  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error('useAppStore must be used inside AppStoreProvider');
  return store;
}
