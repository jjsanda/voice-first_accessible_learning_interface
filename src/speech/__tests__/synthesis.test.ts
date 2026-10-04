import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockSpeechSynthesis } from '../../test/mocks/webSpeech';
import { Speaker } from '../synthesis';

function synth(): MockSpeechSynthesis {
  return window.speechSynthesis as unknown as MockSpeechSynthesis;
}

describe('Speaker', () => {
  let speaker: Speaker;
  let states: boolean[];

  beforeEach(() => {
    states = [];
    speaker = new Speaker({ onSpeakingChange: (s) => states.push(s) });
  });

  it('splits long text into sentence-sized utterances', () => {
    const text = Array.from({ length: 5 }, (_, i) => `This is sentence number ${i + 1}.`).join(' ');
    speaker.speak(text);
    synth().finishAll();
    expect(synth().spoken.length).toBe(5);
    expect(synth().spoken[0]?.text).toBe('This is sentence number 1.');
  });

  it('speaks utterances sequentially, not all at once', () => {
    speaker.speak('First sentence. Second sentence.');
    expect(synth().spoken.length).toBe(1);
    synth().finishCurrent();
    expect(synth().spoken.length).toBe(2);
  });

  it('reports speaking state changes', () => {
    speaker.speak('Hello there.');
    expect(states).toEqual([true]);
    synth().finishAll();
    expect(states).toEqual([true, false]);
    expect(speaker.isSpeaking).toBe(false);
  });

  it('calls onDone after the final piece of the text', () => {
    const onDone = vi.fn();
    speaker.speak('One. Two.', { onDone });
    synth().finishCurrent();
    expect(onDone).not.toHaveBeenCalled();
    synth().finishCurrent();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('stop cancels synthesis and clears the queue', () => {
    speaker.speak('One. Two. Three.');
    speaker.stop();
    expect(synth().cancelCalls).toBe(1);
    expect(speaker.isSpeaking).toBe(false);
    synth().finishAll();
    expect(synth().spoken.length).toBe(1); // nothing new was queued after stop
  });

  it('a cancelled utterance cannot complete speech that replaced it', async () => {
    // Regression: browsers deliver the interrupted utterance's end event
    // asynchronously, after stop() + speak() have started new speech. That
    // stale event must not fire the new speech's onDone or flip the state.
    const firstDone = vi.fn();
    const secondDone = vi.fn();
    speaker.speak('The first long announcement.', { onDone: firstDone });
    speaker.stop();
    speaker.speak('The replacement announcement.', { onDone: secondDone });

    await new Promise<void>((resolve) => queueMicrotask(resolve)); // stale onend arrives

    expect(firstDone).not.toHaveBeenCalled();
    expect(secondDone).not.toHaveBeenCalled(); // still audibly speaking
    expect(speaker.isSpeaking).toBe(true);

    synth().finishCurrent(); // the replacement actually finishes
    expect(secondDone).toHaveBeenCalledTimes(1);
    expect(speaker.isSpeaking).toBe(false);
  });

  it('applies the configured rate to utterances', () => {
    speaker.rate = 1.4;
    speaker.speak('Check the rate.');
    expect(synth().spoken[0]?.rate).toBe(1.4);
  });

  it('queues a second speak call after the first', () => {
    speaker.speak('First text.');
    speaker.speak('Second text.');
    synth().finishAll();
    expect(synth().spoken.map((u) => u.text)).toEqual(['First text.', 'Second text.']);
  });

  it('pause and resume delegate to the synthesis API', () => {
    speaker.speak('Some ongoing speech.');
    speaker.pause();
    expect(speaker.isPaused).toBe(true);
    expect(synth().paused).toBe(true);
    speaker.resume();
    expect(speaker.isPaused).toBe(false);
    expect(synth().paused).toBe(false);
  });
});
