import { splitForSpeech } from '../utils/sentences';

export interface SpeakerCallbacks {
  onSpeakingChange?: (speaking: boolean) => void;
}

export interface SpeakOptions {
  /** Called when this text (all of its pieces) has finished speaking. */
  onDone?: () => void;
}

/**
 * Queue-based wrapper around window.speechSynthesis with workarounds for the
 * well-known browser quirks:
 * - long utterances are cut off in Chromium, so text is spoken one sentence
 *   at a time (see splitForSpeech);
 * - utterances that get garbage-collected go silent mid-speech, so strong
 *   references are kept until each utterance ends;
 * - getVoices() can be empty until the voiceschanged event fires, so the
 *   voice is re-picked for every utterance.
 */
export class Speaker {
  /** Speech rate multiplier, user-adjustable in settings (0.8–1.5). */
  rate = 1;

  private queue: Array<{ utterance: SpeechSynthesisUtterance; onDone?: () => void }> = [];
  private current: { utterance: SpeechSynthesisUtterance; onDone?: () => void } | null = null;
  private paused = false;

  constructor(private readonly callbacks: SpeakerCallbacks = {}) {}

  get isSpeaking(): boolean {
    return this.current !== null || this.queue.length > 0;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  get isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text: string, options: SpeakOptions = {}): void {
    if (!this.isSupported) {
      options.onDone?.();
      return;
    }
    const pieces = splitForSpeech(text);
    if (pieces.length === 0) {
      options.onDone?.();
      return;
    }
    const wasIdle = !this.isSpeaking;
    pieces.forEach((piece, i) => {
      const utterance = new SpeechSynthesisUtterance(piece);
      utterance.lang = 'en-US';
      // Only the final piece completes the logical "speak" call.
      this.queue.push({ utterance, onDone: i === pieces.length - 1 ? options.onDone : undefined });
    });
    if (wasIdle) {
      this.callbacks.onSpeakingChange?.(true);
      this.speakNext();
    }
  }

  stop(): void {
    if (!this.isSupported) return;
    const wasSpeaking = this.isSpeaking;
    this.queue = [];
    this.current = null;
    this.paused = false;
    window.speechSynthesis.cancel();
    if (wasSpeaking) this.callbacks.onSpeakingChange?.(false);
  }

  pause(): void {
    if (!this.isSupported || !this.isSpeaking || this.paused) return;
    this.paused = true;
    window.speechSynthesis.pause();
  }

  resume(): void {
    if (!this.isSupported || !this.paused) return;
    this.paused = false;
    window.speechSynthesis.resume();
  }

  private speakNext(): void {
    const next = this.queue.shift();
    if (!next) {
      this.current = null;
      this.callbacks.onSpeakingChange?.(false);
      return;
    }
    this.current = next;
    const { utterance } = next;
    utterance.rate = this.rate;
    const voice = this.pickVoice();
    if (voice) utterance.voice = voice;
    // Bind completion to THIS entry: cancel() delivers the interrupted
    // utterance's end event asynchronously, after new speech may already have
    // started, and that stale event must not complete the new entry.
    utterance.onend = () => this.finish(next);
    utterance.onerror = () => this.finish(next);
    window.speechSynthesis.speak(utterance);
  }

  private finish(entry: { utterance: SpeechSynthesisUtterance; onDone?: () => void }): void {
    if (this.current !== entry) return; // stale event from a cancelled utterance
    this.current = null;
    entry.onDone?.();
    this.speakNext();
  }

  private pickVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    return (
      english.find((v) => v.localService && v.default) ??
      english.find((v) => v.localService) ??
      english[0] ??
      null
    );
  }
}
