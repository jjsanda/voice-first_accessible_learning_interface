import { useEffect, useRef } from 'react';
import { Flashcard } from '../components/Flashcard';
import type { Intent } from '../types/commands';
import { useAppStore } from '../state/appStore';

export function QuizView({ onIntent }: { onIntent: (intent: Intent) => void }) {
  const { state, cardById } = useAppStore();
  const { quiz } = state;
  const currentCardId = quiz.queueIds[quiz.index];
  const card = currentCardId ? cardById(currentCardId) : undefined;

  // When the last card unmounts, catch keyboard focus on the summary heading.
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null);
  const sessionFinished = quiz.started && !card && quiz.queueIds.length > 0;
  useEffect(() => {
    if (sessionFinished) summaryHeadingRef.current?.focus();
  }, [sessionFinished]);

  return (
    <div>
      <h1 tabIndex={-1} data-view-heading>
        Quiz
      </h1>

      {!quiz.started && (
        <div className="card quiz__empty">
          <p>
            Review the course with flashcards. Cards you get wrong come back sooner; cards you know
            come back later.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onIntent({ type: 'GO_TO', target: 'quiz' })}
          >
            Start review session
          </button>
        </div>
      )}

      {quiz.started && card && (
        <Flashcard
          card={card}
          revealed={quiz.revealed}
          position={quiz.index + 1}
          total={quiz.queueIds.length}
          onFlip={() => onIntent({ type: 'FLIP' })}
          onGrade={(correct) => onIntent({ type: correct ? 'MARK_RIGHT' : 'MARK_WRONG' })}
          onSkip={() => onIntent({ type: 'NEXT' })}
        />
      )}

      {quiz.started && !card && (
        <div className="card quiz__summary">
          {quiz.queueIds.length === 0 ? (
            <>
              <h2>Nothing due right now</h2>
              <p>You're all caught up. Come back later — spaced repetition works best that way.</p>
            </>
          ) : (
            <>
              <h2 ref={summaryHeadingRef} tabIndex={-1}>
                Session complete 🎉
              </h2>
              <p>
                You reviewed {quiz.stats.reviewed} cards: {quiz.stats.correct} right,{' '}
                {quiz.stats.wrong} wrong.
              </p>
            </>
          )}
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onIntent({ type: 'GO_TO', target: 'quiz' })}
          >
            Start a new session
          </button>
        </div>
      )}
    </div>
  );
}
