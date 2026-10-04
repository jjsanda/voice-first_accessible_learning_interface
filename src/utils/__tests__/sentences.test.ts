import { describe, expect, it } from 'vitest';
import { splitForSpeech, splitSentences } from '../sentences';

describe('splitSentences', () => {
  it('splits on sentence-ending punctuation', () => {
    expect(splitSentences('One. Two! Three?')).toEqual(['One.', 'Two!', 'Three?']);
  });

  it('does not split after common abbreviations', () => {
    expect(splitSentences('Some sorts, e.g. mergesort, are stable.')).toEqual([
      'Some sorts, e.g. mergesort, are stable.',
    ]);
  });

  it('keeps trailing text without terminal punctuation', () => {
    expect(splitSentences('Complete sentence. And a fragment')).toEqual([
      'Complete sentence.',
      'And a fragment',
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(splitSentences('')).toEqual([]);
  });
});

describe('splitForSpeech', () => {
  it('keeps short sentences intact', () => {
    expect(splitForSpeech('Hello there. Nice day.')).toEqual(['Hello there.', 'Nice day.']);
  });

  it('splits paragraphs into separate pieces', () => {
    expect(splitForSpeech('First paragraph.\n\nSecond paragraph.')).toEqual([
      'First paragraph.',
      'Second paragraph.',
    ]);
  });

  it('divides an overlong sentence into pieces under the limit', () => {
    const long = 'clause one keeps going and going, clause two keeps going and going, '.repeat(5);
    const pieces = splitForSpeech(long, 100);
    expect(pieces.length).toBeGreaterThan(1);
    for (const piece of pieces) {
      expect(piece.length).toBeLessThanOrEqual(100);
    }
  });

  it('never returns empty pieces', () => {
    const pieces = splitForSpeech('A.  \n\n  B.');
    expect(pieces.every((p) => p.trim().length > 0)).toBe(true);
  });
});
