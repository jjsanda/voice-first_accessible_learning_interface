/**
 * Web Speech API feature detection and the minimal typings we rely on.
 * SpeechRecognition is unprefixed in some browsers, webkit-prefixed in others,
 * and absent in the rest — the app must work in all three cases.
 */

export interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

export interface SpeechRecognitionErrorEventLike {
  error: string;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: ((event: unknown) => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((event: unknown) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface SpeechSupport {
  /** Speech-to-text (voice input). Chromium-only at the time of writing. */
  stt: boolean;
  /** Text-to-speech (read aloud). Available in all modern browsers. */
  tts: boolean;
}

export function detectSpeechSupport(): SpeechSupport {
  return {
    stt: getSpeechRecognitionCtor() !== null,
    tts: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
}
