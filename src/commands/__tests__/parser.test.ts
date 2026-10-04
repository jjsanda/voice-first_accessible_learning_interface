import { describe, expect, it } from 'vitest';
import type { AppMode, Intent } from '../../types/commands';
import { normalize } from '../normalize';
import { parseCommand } from '../parser';

function intentOf(transcript: string, mode: AppMode): Intent {
  return parseCommand(transcript, { mode }).intent;
}

describe('normalize', () => {
  it('lowercases, strips punctuation and collapses whitespace', () => {
    expect(normalize('  Flip   the CARD! ')).toBe('flip the card');
  });

  it('strips politeness prefixes, even stacked ones', () => {
    expect(normalize('Please flip the card')).toBe('flip the card');
    expect(normalize('Could you please repeat')).toBe('repeat');
  });

  it('converts number words to digits', () => {
    expect(normalize('read lesson three')).toBe('read lesson 3');
  });
});

describe('global commands work in every mode', () => {
  const modes: AppMode[] = ['home', 'ask', 'lessons', 'quiz', 'settings'];

  it.each(modes)('stop / pause / resume / help in %s mode', (mode) => {
    expect(intentOf('stop', mode)).toEqual({ type: 'STOP_SPEAKING' });
    expect(intentOf('be quiet', mode)).toEqual({ type: 'STOP_SPEAKING' });
    expect(intentOf('pause', mode)).toEqual({ type: 'PAUSE' });
    expect(intentOf('continue', mode)).toEqual({ type: 'RESUME' });
    expect(intentOf('help', mode)).toEqual({ type: 'HELP' });
    expect(intentOf('what can I say', mode)).toEqual({ type: 'HELP' });
  });

  it.each(modes)('navigation in %s mode', (mode) => {
    expect(intentOf('go to the quiz', mode)).toEqual({ type: 'GO_TO', target: 'quiz' });
    expect(intentOf('open lessons', mode)).toEqual({ type: 'GO_TO', target: 'lessons' });
    expect(intentOf('take me to settings', mode)).toEqual({ type: 'GO_TO', target: 'settings' });
    expect(intentOf('go home', mode)).toEqual({ type: 'GO_TO', target: 'home' });
  });

  it('maps navigation synonyms to the right mode', () => {
    expect(intentOf('open flashcards', 'home')).toEqual({ type: 'GO_TO', target: 'quiz' });
    expect(intentOf('show me the questions page', 'home')).toEqual({
      type: 'GO_TO',
      target: 'ask',
    });
  });

  it.each(modes)('explicit ask prefix in %s mode', (mode) => {
    expect(intentOf('ask what is a hash table', mode)).toEqual({
      type: 'ASK_QUESTION',
      question: 'what is a hash table',
    });
  });
});

describe('quiz mode', () => {
  it('parses next and skip', () => {
    expect(intentOf('next card', 'quiz')).toEqual({ type: 'NEXT' });
    expect(intentOf('skip', 'quiz')).toEqual({ type: 'NEXT' });
  });

  it('parses flip with several phrasings', () => {
    expect(intentOf('flip the card', 'quiz')).toEqual({ type: 'FLIP' });
    expect(intentOf('show me the answer', 'quiz')).toEqual({ type: 'FLIP' });
    expect(intentOf('reveal', 'quiz')).toEqual({ type: 'FLIP' });
  });

  it('parses grading phrases', () => {
    expect(intentOf('I got it right', 'quiz')).toEqual({ type: 'MARK_RIGHT' });
    expect(intentOf('correct', 'quiz')).toEqual({ type: 'MARK_RIGHT' });
    expect(intentOf('I knew that', 'quiz')).toEqual({ type: 'MARK_RIGHT' });
    expect(intentOf('wrong', 'quiz')).toEqual({ type: 'MARK_WRONG' });
    expect(intentOf("I didn't know that", 'quiz')).toEqual({ type: 'MARK_WRONG' });
    expect(intentOf('no idea', 'quiz')).toEqual({ type: 'MARK_WRONG' });
  });

  it('parses repeat', () => {
    expect(intentOf('say that again', 'quiz')).toEqual({ type: 'REPEAT' });
  });

  it('quiz commands do not fire outside quiz mode', () => {
    expect(intentOf('flip the card', 'lessons')).toEqual({
      type: 'UNRECOGNIZED',
      transcript: 'flip the card',
    });
    expect(intentOf('i got it right', 'home')).toEqual({
      type: 'UNRECOGNIZED',
      transcript: 'i got it right',
    });
  });
});

describe('lessons mode', () => {
  it('parses reading a lesson by number, including number words', () => {
    expect(intentOf('read lesson 2', 'lessons')).toEqual({ type: 'READ_LESSON', lessonRef: '2' });
    expect(intentOf('read lesson three', 'lessons')).toEqual({
      type: 'READ_LESSON',
      lessonRef: '3',
    });
  });

  it('parses reading a lesson by title fragment', () => {
    expect(intentOf('open the lesson about hash tables', 'lessons')).toEqual({
      type: 'READ_LESSON',
      lessonRef: 'hash tables',
    });
  });

  it('works from the home view too', () => {
    expect(intentOf('read lesson 1', 'home')).toEqual({ type: 'READ_LESSON', lessonRef: '1' });
  });

  it('parses bare read as reading the current lesson', () => {
    expect(intentOf('read aloud', 'lessons')).toEqual({ type: 'READ_LESSON' });
  });

  it('parses section navigation', () => {
    expect(intentOf('next section', 'lessons')).toEqual({ type: 'NEXT' });
    expect(intentOf('skip this section', 'lessons')).toEqual({ type: 'NEXT' });
    expect(intentOf('go back', 'lessons')).toEqual({ type: 'PREVIOUS' });
    expect(intentOf('previous section', 'lessons')).toEqual({ type: 'PREVIOUS' });
  });
});

describe('ask mode fallback', () => {
  it('treats unmatched speech as the question, preserving original casing', () => {
    expect(intentOf('What is the difference between BFS and DFS?', 'ask')).toEqual({
      type: 'ASK_QUESTION',
      question: 'What is the difference between BFS and DFS?',
    });
  });

  it('still prioritizes commands over the fallback', () => {
    expect(intentOf('go to the quiz', 'ask')).toEqual({ type: 'GO_TO', target: 'quiz' });
    expect(intentOf('stop', 'ask')).toEqual({ type: 'STOP_SPEAKING' });
  });
});

describe('unrecognized input', () => {
  it('returns UNRECOGNIZED with the original transcript outside ask mode', () => {
    expect(intentOf('bananas are yellow', 'quiz')).toEqual({
      type: 'UNRECOGNIZED',
      transcript: 'bananas are yellow',
    });
  });

  it('handles empty or whitespace transcripts', () => {
    expect(intentOf('   ', 'home')).toEqual({ type: 'UNRECOGNIZED', transcript: '' });
  });
});
