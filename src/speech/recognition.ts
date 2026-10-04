import { getSpeechRecognitionCtor, type SpeechRecognitionLike } from './support';

export interface RecognitionError {
  code: 'not-allowed' | 'no-speech' | 'audio-capture' | 'network' | 'unknown';
  message: string;
  /** Fatal errors (like blocked mic permission) should not be auto-retried. */
  fatal: boolean;
}

export interface RecognizerCallbacks {
  onInterim: (transcript: string) => void;
  onFinal: (transcript: string) => void;
  onError: (error: RecognitionError) => void;
  onListeningChange: (listening: boolean) => void;
}

function mapError(error: string): RecognitionError | null {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return {
        code: 'not-allowed',
        message: 'Microphone access is blocked. Allow it in your browser settings to use voice.',
        fatal: true,
      };
    case 'no-speech':
      return { code: 'no-speech', message: "I didn't hear anything. Try again.", fatal: false };
    case 'audio-capture':
      return { code: 'audio-capture', message: 'No microphone was found.', fatal: true };
    case 'network':
      return {
        code: 'network',
        message: 'The speech service could not be reached. Check your connection.',
        fatal: false,
      };
    case 'aborted':
      return null; // Deliberate cancellation — not an error worth announcing.
    default:
      return { code: 'unknown', message: `Voice input failed (${error}).`, fatal: false };
  }
}

/**
 * Push-to-talk wrapper around one SpeechRecognition session at a time.
 * Non-continuous mode: the browser stops listening after the user finishes a
 * phrase, which avoids restart loops, echo pickup and battery drain.
 */
export class SpeechRecognizer {
  private session: SpeechRecognitionLike | null = null;

  constructor(private readonly callbacks: RecognizerCallbacks) {}

  get isListening(): boolean {
    return this.session !== null;
  }

  start(): void {
    if (this.session) return;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      this.callbacks.onError({
        code: 'unknown',
        message: 'Voice input is not supported in this browser.',
        fatal: true,
      });
      return;
    }

    const session = new Ctor();
    session.lang = 'en-US';
    session.continuous = false;
    session.interimResults = true;

    session.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!;
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) final += transcript;
        else interim += transcript;
      }
      if (interim) this.callbacks.onInterim(interim);
      if (final.trim()) this.callbacks.onFinal(final.trim());
    };

    session.onerror = (event) => {
      const error = mapError(event.error);
      if (error) this.callbacks.onError(error);
    };

    session.onend = () => {
      this.session = null;
      this.callbacks.onListeningChange(false);
    };

    this.session = session;
    session.start();
    this.callbacks.onListeningChange(true);
  }

  stop(): void {
    this.session?.stop();
  }

  abort(): void {
    this.session?.abort();
  }
}
