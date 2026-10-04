import { describe, expect, it } from 'vitest';
import type { SearchResult } from '../../types/answer';
import type { Chunk } from '../../retrieval/chunker';
import { ExtractiveEngine } from '../ExtractiveEngine';

function result(score: number, text: string, overrides: Partial<Chunk> = {}): SearchResult {
  return {
    score,
    chunk: {
      id: 'chunk-1',
      lessonId: 'sorting',
      lessonTitle: 'Sorting Algorithms',
      sectionId: 'quicksort',
      sectionTitle: 'Quicksort',
      text,
      ...overrides,
    },
  };
}

const engine = new ExtractiveEngine(['Big-O Notation', 'Sorting Algorithms', 'Hash Tables']);

describe('ExtractiveEngine', () => {
  it('quotes the sentences that answer the question', async () => {
    const answer = await engine.answer('how fast is quicksort on average', [
      result(
        5,
        'Quicksort picks a pivot element. On average quicksort runs fast, in O(n log n) time. It was invented by Tony Hoare.',
      ),
    ]);
    expect(answer.grounded).toBe(true);
    expect(answer.text).toContain('On average quicksort runs fast');
    expect(answer.text).not.toContain('Tony Hoare');
  });

  it('cites the lesson and section the sentences came from', async () => {
    const answer = await engine.answer('quicksort speed', [
      result(5, 'Quicksort speed is O(n log n) on average.'),
    ]);
    expect(answer.citations).toEqual([
      {
        lessonId: 'sorting',
        lessonTitle: 'Sorting Algorithms',
        sectionId: 'quicksort',
        sectionTitle: 'Quicksort',
      },
    ]);
  });

  it('does not duplicate citations when several sentences share a section', async () => {
    const answer = await engine.answer('quicksort pivot speed', [
      result(5, 'Quicksort picks a pivot. The pivot splits the array. Quicksort speed is high.'),
    ]);
    expect(answer.citations).toHaveLength(1);
  });

  it('produces a spoken variant that names the source', async () => {
    const answer = await engine.answer('quicksort speed', [
      result(5, 'Quicksort speed is O(n log n) on average.'),
    ]);
    expect(answer.spokenText).toMatch(/^From Sorting Algorithms, Quicksort:/);
  });

  it('answers honestly when nothing relevant was retrieved', async () => {
    const answer = await engine.answer('what is photosynthesis', []);
    expect(answer.grounded).toBe(false);
    expect(answer.text).toContain("couldn't find that in this course");
    expect(answer.text).toContain('Big-O Notation');
    expect(answer.citations).toEqual([]);
  });

  it('answers honestly when the best match is below the relevance threshold', async () => {
    const answer = await engine.answer('unrelated topic', [result(0.3, 'Barely related text.')]);
    expect(answer.grounded).toBe(false);
  });

  it('orders quoted sentences by their position in the source, not by score', async () => {
    const answer = await engine.answer('pivot partition quicksort', [
      result(
        5,
        'Quicksort picks a pivot first. Filler sentence with nothing useful. Then it partitions around the pivot, and quicksort recurses on both partitions.',
      ),
    ]);
    const first = answer.text.indexOf('picks a pivot first');
    const second = answer.text.indexOf('partitions around the pivot');
    expect(first).toBeGreaterThanOrEqual(0);
    expect(second).toBeGreaterThan(first);
  });
});
