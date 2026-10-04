import { describe, expect, it } from 'vitest';
import { buildIndex } from '../bm25';
import type { Chunk } from '../chunker';

function chunk(id: string, text: string, extra: Partial<Chunk> = {}): Chunk {
  return {
    id,
    lessonId: 'lesson-1',
    lessonTitle: 'Lesson',
    sectionId: id,
    sectionTitle: 'Section',
    text,
    ...extra,
  };
}

const corpus: Chunk[] = [
  chunk('c1', 'Quicksort is a fast sorting algorithm with average time complexity of O(n log n).'),
  chunk('c2', 'Bubble sort repeatedly swaps adjacent elements and is slow on large arrays.'),
  chunk('c3', 'A hash table stores key value pairs and offers constant time lookup on average.'),
  chunk('c4', 'Binary search halves the search space at every step, requiring sorted data.'),
  chunk('c5', 'A queue is a first in first out data structure used in breadth first search.'),
  chunk('c6', 'Linked lists allow constant time insertion at the head but slow random access.'),
];

describe('buildIndex', () => {
  it('ranks the on-topic chunk first', () => {
    const index = buildIndex(corpus);
    const results = index.search('how fast is quicksort', 3);
    expect(results[0]?.chunk.id).toBe('c1');
  });

  it('weights rare terms above common ones', () => {
    const index = buildIndex([
      chunk('common1', 'algorithm algorithm algorithm data data'),
      chunk('common2', 'algorithm data structures overview'),
      chunk('rare', 'algorithm data and the rare word memoization'),
    ]);
    const results = index.search('memoization algorithm', 3);
    expect(results[0]?.chunk.id).toBe('rare');
  });

  it('boosts matches on lesson and section titles', () => {
    const index = buildIndex([
      chunk('untitled', 'This text never mentions the topic by name.', {
        sectionTitle: 'Hash Tables Explained',
      }),
      chunk('other', 'Sorting is rearranging elements into order.'),
    ]);
    const results = index.search('hash tables', 2);
    expect(results[0]?.chunk.id).toBe('untitled');
  });

  it('returns empty results for queries with no matching terms', () => {
    const index = buildIndex(corpus);
    expect(index.search('photosynthesis chlorophyll', 5)).toEqual([]);
  });

  it('returns empty results for stopword-only queries', () => {
    const index = buildIndex(corpus);
    expect(index.search('what is the', 5)).toEqual([]);
  });

  it('respects the result limit and orders by descending score', () => {
    const index = buildIndex(corpus);
    const results = index.search('sorting algorithm time', 2);
    expect(results.length).toBeLessThanOrEqual(2);
    const scores = results.map((r) => r.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('handles an empty corpus', () => {
    const index = buildIndex([]);
    expect(index.search('anything', 3)).toEqual([]);
  });
});
