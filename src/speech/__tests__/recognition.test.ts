import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockSpeechRecognition } from '../../test/mocks/webSpeech';
import { SpeechRecognizer, type RecognizerCallbacks } from '../recognition';

function makeRecognizer() {
  const callbacks: RecognizerCallbacks = {
    onInterim: vi.fn(),
    onFinal: vi.fn(),
    onError: vi.fn(),
    onListeningChange: vi.fn(),
  };
  return { recognizer: new SpeechRecognizer(callbacks), callbacks };
}

describe('SpeechRecognizer', () => {
  beforeEach(() => MockSpeechRecognition.reset());

  it('starts a push-to-talk session with interim results', () => {
    const { recognizer, callbacks } = makeRecognizer();
    recognizer.start();
    const session = MockSpeechRecognition.latest()!;
    expect(session.continuous).toBe(false);
    expect(session.interimResults).toBe(true);
    expect(session.lang).toBe('en-US');
    expect(callbacks.onListeningChange).toHaveBeenCalledWith(true);
    expect(recognizer.isListening).toBe(true);
  });

  it('ignores start while already listening', () => {
    const { recognizer } = makeRecognizer();
    recognizer.start();
    recognizer.start();
    expect(MockSpeechRecognition.instances.length).toBe(1);
  });

  it('delivers interim and final transcripts', () => {
    const { recognizer, callbacks } = makeRecognizer();
    recognizer.start();
    const session = MockSpeechRecognition.latest()!;
    session.emitResult('next ca', false);
    expect(callbacks.onInterim).toHaveBeenCalledWith('next ca');
    session.emitResult('next card', true);
    expect(callbacks.onFinal).toHaveBeenCalledWith('next card');
  });

  it('reports listening ended when the session ends', () => {
    const { recognizer, callbacks } = makeRecognizer();
    recognizer.start();
    MockSpeechRecognition.latest()!.emitEnd();
    expect(callbacks.onListeningChange).toHaveBeenLastCalledWith(false);
    expect(recognizer.isListening).toBe(false);
  });

  it('maps permission errors to a fatal, human-readable error', () => {
    const { recognizer, callbacks } = makeRecognizer();
    recognizer.start();
    MockSpeechRecognition.latest()!.emitError('not-allowed');
    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'not-allowed', fatal: true }),
    );
  });

  it('maps no-speech to a gentle, non-fatal error', () => {
    const { recognizer, callbacks } = makeRecognizer();
    recognizer.start();
    MockSpeechRecognition.latest()!.emitError('no-speech');
    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'no-speech', fatal: false }),
    );
  });

  it('stays silent on deliberate aborts', () => {
    const { recognizer, callbacks } = makeRecognizer();
    recognizer.start();
    MockSpeechRecognition.latest()!.emitError('aborted');
    expect(callbacks.onError).not.toHaveBeenCalled();
  });

  it('can start a new session after the previous one ended', () => {
    const { recognizer } = makeRecognizer();
    recognizer.start();
    MockSpeechRecognition.latest()!.emitEnd();
    recognizer.start();
    expect(MockSpeechRecognition.instances.length).toBe(2);
    expect(recognizer.isListening).toBe(true);
  });

  it('reports an error when the browser has no speech recognition', () => {
    const w = window as unknown as Record<string, unknown>;
    delete w.SpeechRecognition;
    delete w.webkitSpeechRecognition;
    const g = globalThis as unknown as Record<string, unknown>;
    delete g.SpeechRecognition;
    delete g.webkitSpeechRecognition;
    const { recognizer, callbacks } = makeRecognizer();
    recognizer.start();
    expect(callbacks.onError).toHaveBeenCalledWith(expect.objectContaining({ fatal: true }));
    expect(recognizer.isListening).toBe(false);
  });
});
