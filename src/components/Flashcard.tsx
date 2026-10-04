import { useEffect, useRef } from 'react';
import type { Flashcard as FlashcardData } from '../types/course';

export interface FlashcardProps {
  card: FlashcardData;
  revealed: boolean;
  position: number;
  total: number;
  onFlip: () => void;
  onGrade: (correct: boolean) => void;
  onSkip: () => void;
}

export function Flashcard({
  card,
  revealed,
  position,
  total,
  onFlip,
  onGrade,
  onSkip,
}: FlashcardProps) {
  const flipButtonRef = useRef<HTMLButtonElement>(null);
  const rightButtonRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(false);

  // The control sets swap on flip/grade, which would drop keyboard focus to
  // <body>. Hand focus to the natural next control instead.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (revealed) rightButtonRef.current?.focus();
    else flipButtonRef.current?.focus();
  }, [revealed, card.id]);

  return (
    <div className="flashcard-area">
      <p className="flashcard-area__progress">
        Card {position} of {total}
      </p>
      <div className="card flashcard">
        <p className="flashcard__side-label">{revealed ? 'Answer' : 'Question'}</p>
        <p className="flashcard__text">{revealed ? card.back : card.front}</p>
      </div>
      <div className="flashcard-area__controls">
        {revealed ? (
          <>
            <button
              type="button"
              className="btn flashcard-area__wrong"
              onClick={() => onGrade(false)}
            >
              ✗ I got it wrong
            </button>
            <button
              ref={rightButtonRef}
              type="button"
              className="btn flashcard-area__right"
              onClick={() => onGrade(true)}
            >
              ✓ I got it right
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn--quiet" onClick={onSkip}>
              Skip
            </button>
            <button ref={flipButtonRef} type="button" className="btn btn--primary" onClick={onFlip}>
              Show answer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
