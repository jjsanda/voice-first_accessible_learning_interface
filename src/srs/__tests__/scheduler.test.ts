import { describe, expect, it } from 'vitest';
import type { Flashcard } from '../../types/course';
import {
  buildQueue,
  emptyStats,
  gradeCard,
  initialProgress,
  isDue,
  MAX_BOX,
  recordGrade,
} from '../scheduler';
import { loadProgress, saveProgress } from '../progressStore';

const NOW = 1_700_000_000_000;
const HOUR = 60 * 60 * 1000;

function card(id: string): Flashcard {
  return { id, lessonId: 'l1', front: `Q ${id}`, back: `A ${id}` };
}

describe('gradeCard', () => {
  it('promotes one box on a correct answer', () => {
    const p = gradeCard(initialProgress('c1', NOW), true, NOW);
    expect(p.box).toBe(1);
    expect(p.correctCount).toBe(1);
  });

  it('never promotes beyond the top box', () => {
    let p = initialProgress('c1', NOW);
    for (let i = 0; i < 10; i++) p = gradeCard(p, true, NOW);
    expect(p.box).toBe(MAX_BOX);
  });

  it('demotes straight to box zero on a wrong answer', () => {
    let p = initialProgress('c1', NOW);
    p = gradeCard(p, true, NOW);
    p = gradeCard(p, true, NOW);
    p = gradeCard(p, false, NOW);
    expect(p.box).toBe(0);
    expect(p.wrongCount).toBe(1);
  });

  it('schedules higher boxes further into the future', () => {
    const box1 = gradeCard(initialProgress('c1', NOW), true, NOW);
    const box2 = gradeCard(box1, true, NOW);
    expect(box2.dueAt).toBeGreaterThan(box1.dueAt);
  });

  it('a demoted card is due immediately', () => {
    const p = gradeCard(gradeCard(initialProgress('c1', NOW), true, NOW), false, NOW);
    expect(isDue(p, NOW)).toBe(true);
  });
});

describe('buildQueue', () => {
  it('puts due cards before unseen cards', () => {
    const cards = [card('unseen'), card('due')];
    const progress = new Map([['due', { ...initialProgress('due', NOW - HOUR) }]]);
    const queue = buildQueue(cards, progress, NOW);
    expect(queue.map((c) => c.id)).toEqual(['due', 'unseen']);
  });

  it('orders due cards by box, shakiest first', () => {
    const cards = [card('solid'), card('shaky')];
    const solid = gradeCard(gradeCard(initialProgress('solid', NOW), true, NOW), true, NOW);
    const progress = new Map([
      ['solid', { ...solid, dueAt: NOW - HOUR }],
      ['shaky', initialProgress('shaky', NOW - HOUR)],
    ]);
    const queue = buildQueue(cards, progress, NOW);
    expect(queue.map((c) => c.id)).toEqual(['shaky', 'solid']);
  });

  it('excludes cards that are not yet due', () => {
    const cards = [card('later')];
    const progress = new Map([['later', { ...initialProgress('later', NOW), dueAt: NOW + HOUR }]]);
    expect(buildQueue(cards, progress, NOW)).toEqual([]);
  });

  it('respects the session limit', () => {
    const cards = Array.from({ length: 30 }, (_, i) => card(`c${i}`));
    expect(buildQueue(cards, new Map(), NOW, 20)).toHaveLength(20);
  });
});

describe('session stats', () => {
  it('accumulates reviewed, correct and wrong counts', () => {
    let stats = emptyStats();
    stats = recordGrade(stats, true);
    stats = recordGrade(stats, false);
    stats = recordGrade(stats, true);
    expect(stats).toEqual({ reviewed: 3, correct: 2, wrong: 1 });
  });
});

describe('progressStore', () => {
  it('round-trips progress through localStorage', () => {
    const progress = new Map([
      ['c1', gradeCard(initialProgress('c1', NOW), true, NOW)],
      ['c2', initialProgress('c2', NOW)],
    ]);
    saveProgress(progress);
    const loaded = loadProgress();
    expect(loaded.size).toBe(2);
    expect(loaded.get('c1')).toEqual(progress.get('c1'));
  });

  it('returns an empty map when nothing is stored', () => {
    expect(loadProgress().size).toBe(0);
  });
});
