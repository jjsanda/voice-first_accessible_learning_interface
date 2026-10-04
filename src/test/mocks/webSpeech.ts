/**
 * Test doubles for the Web Speech API, which jsdom does not implement.
 * They record calls and let tests drive events (results, errors, end).
 */

type Listener = (event: unknown) => void;

export class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = [];

  lang = '';
  continuous = false;
  interimResults = false;
  onresult: Listener | null = null;
  onerror: Listener | null = null;
  onend: Listener | null = null;
  onstart: Listener | null = null;
  started = false;
  startCalls = 0;
  abortCalls = 0;

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }

  start() {
    this.started = true;
    this.startCalls += 1;
    this.onstart?.({});
  }

  stop() {
    this.started = false;
    this.onend?.({});
  }

  abort() {
    this.started = false;
    this.abortCalls += 1;
    this.onend?.({});
  }

  emitResult(transcript: string, isFinal: boolean) {
    this.onresult?.({
      resultIndex: 0,
      results: [Object.assign([{ transcript, confidence: 0.9 }], { isFinal })],
    });
  }

  emitError(error: string) {
    this.onerror?.({ error });
  }

  emitEnd() {
    this.started = false;
    this.onend?.({});
  }

  static reset() {
    MockSpeechRecognition.instances = [];
  }

  static latest(): MockSpeechRecognition | undefined {
    return MockSpeechRecognition.instances.at(-1);
  }
}

export class MockUtterance {
  text: string;
  lang = '';
  rate = 1;
  voice: unknown = null;
  onstart: Listener | null = null;
  onend: Listener | null = null;
  onerror: Listener | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

export class MockSpeechSynthesis {
  spoken: MockUtterance[] = [];
  pending: MockUtterance[] = [];
  speaking = false;
  paused = false;
  cancelCalls = 0;
  private voices: unknown[] = [
    { name: 'Test English', lang: 'en-US', localService: true, default: true },
  ];

  speak(utterance: MockUtterance) {
    this.spoken.push(utterance);
    this.pending.push(utterance);
    this.speaking = true;
    utterance.onstart?.({});
  }

  cancel() {
    this.cancelCalls += 1;
    const cancelled = this.pending;
    this.pending = [];
    this.speaking = false;
    this.paused = false;
    // Real browsers deliver the interrupted utterance's end/error event
    // asynchronously, possibly after new speech has started. Mirror that.
    for (const utterance of cancelled) {
      queueMicrotask(() => utterance.onend?.({}));
    }
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  getVoices() {
    return this.voices;
  }

  addEventListener() {}
  removeEventListener() {}

  /** Simulate the current utterance finishing. */
  finishCurrent() {
    const current = this.pending.shift();
    if (this.pending.length === 0) this.speaking = false;
    current?.onend?.({});
  }

  finishAll() {
    while (this.pending.length > 0) this.finishCurrent();
  }
}

export function installWebSpeechMocks(): { synthesis: MockSpeechSynthesis } {
  const synthesis = new MockSpeechSynthesis();
  MockSpeechRecognition.reset();
  Object.assign(globalThis, {
    SpeechRecognition: MockSpeechRecognition,
    webkitSpeechRecognition: MockSpeechRecognition,
    SpeechSynthesisUtterance: MockUtterance,
    speechSynthesis: synthesis,
  });
  Object.assign(window, {
    SpeechRecognition: MockSpeechRecognition,
    webkitSpeechRecognition: MockSpeechRecognition,
    SpeechSynthesisUtterance: MockUtterance,
    speechSynthesis: synthesis,
  });
  return { synthesis };
}
