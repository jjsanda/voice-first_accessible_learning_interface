import type { Flashcard } from '../types/course';

/**
 * Leitner-style spaced repetition. Cards live in boxes 0-4; a correct answer
 * promotes a card one box, a wrong answer sends it back to box 0. Higher
 * boxes are reviewed less often. Pure functions — persistence lives elsewhere.
 */

export const MAX_BOX = 4;

/** Review intervals per box, in hours. Box 0 is always due. */
const BOX_INTERVAL_HOURS = [0, 8, 24, 72, 168] as const;

export interface CardProgress {
  cardId: string;
  box: number;
  /** Epoch milliseconds when the card becomes due again. */
  dueAt: number;
  correctCount: number;
  wrongCount: number;
}

export function initialProgress(cardId: string, now: number): CardProgress {
  return { cardId, box: 0, dueAt: now, correctCount: 0, wrongCount: 0 };
}

export function gradeCard(progress: CardProgress, correct: boolean, now: number): CardProgress {
  const box = correct ? Math.min(progress.box + 1, MAX_BOX) : 0;
  return {
    ...progress,
    box,
    dueAt: now + BOX_INTERVAL_HOURS[box]! * 60 * 60 * 1000,
    correctCount: progress.correctCount + (correct ? 1 : 0),
    wrongCount: progress.wrongCount + (correct ? 0 : 1),
  };
}

export function isDue(progress: CardProgress, now: number): boolean {
  return progress.dueAt <= now;
}

/**
 * Builds a review queue: due cards first (lowest box first, so the shakiest
 * cards come up early), then — if the session still has room — unseen cards
 * in course order.
 */
export function buildQueue(
  cards: Flashcard[],
  progressByCard: ReadonlyMap<string, CardProgress>,
  now: number,
  limit = 20,
): Flashcard[] {
  const due: Array<{ card: Flashcard; progress: CardProgress }> = [];
  const unseen: Flashcard[] = [];

  for (const card of cards) {
    const progress = progressByCard.get(card.id);
    if (progress === undefined) {
      unseen.push(card);
    } else if (isDue(progress, now)) {
      due.push({ card, progress });
    }
  }

  due.sort((a, b) => a.progress.box - b.progress.box || a.progress.dueAt - b.progress.dueAt);
  return [...due.map((d) => d.card), ...unseen].slice(0, limit);
}

export interface SessionStats {
  reviewed: number;
  correct: number;
  wrong: number;
}

export function emptyStats(): SessionStats {
  return { reviewed: 0, correct: 0, wrong: 0 };
}

export function recordGrade(stats: SessionStats, correct: boolean): SessionStats {
  return {
    reviewed: stats.reviewed + 1,
    correct: stats.correct + (correct ? 1 : 0),
    wrong: stats.wrong + (correct ? 0 : 1),
  };
}
