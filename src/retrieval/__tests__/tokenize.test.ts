import { describe, expect, it } from 'vitest';
import { stem, tokenize } from '../tokenize';

describe('stem', () => {
  it('strips common suffixes', () => {
    expect(stem('sorting')).toBe('sort');
    expect(stem('sorted')).toBe('sort');
    expect(stem('sorts')).toBe('sort');
    expect(stem('arrays')).toBe('array');
    expect(stem('searches')).toBe('search');
    expect(stem('classes')).toBe('class');
    expect(stem('complexities')).toBe('complexity');
  });

  it('never produces a stem shorter than three characters', () => {
    expect(stem('ring')).toBe('ring');
    expect(stem('red')).toBe('red');
    expect(stem('is')).toBe('is');
  });

  it('leaves words without a known suffix unchanged', () => {
    expect(stem('graph')).toBe('graph');
    expect(stem('binary')).toBe('binary');
  });
});

describe('tokenize', () => {
  it('lowercases and strips punctuation', () => {
    expect(tokenize('What is Big-O?')).toEqual(['big']);
  });

  it('drops stopwords and single characters', () => {
    expect(tokenize('the time of a merge')).toEqual(['time', 'merge']);
  });

  it('keeps numbers', () => {
    expect(tokenize('lesson 42')).toEqual(['lesson', '42']);
  });

  it('stems so query and content forms match', () => {
    const query = tokenize('how does sorting work');
    const content = tokenize('This algorithm sorts the array.');
    expect(query).toContain('sort');
    expect(content).toContain('sort');
  });

  it('returns an empty array for stopword-only input', () => {
    expect(tokenize('what is the')).toEqual([]);
  });
});
