import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { detectSpeechSupport } from './support';
import { Speaker, type SpeakOptions } from './synthesis';

export interface UseSpeechSynthesisResult {
  supported: boolean;
  speaking: boolean;
  paused: boolean;
  speak: (text: string, options?: SpeakOptions) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setRate: (rate: number) => void;
}

/** React binding for the sentence-queued text-to-speech Speaker. */
export function useSpeechSynthesis(initialRate = 1): UseSpeechSynthesisResult {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const supported = useMemo(() => detectSpeechSupport().tts, []);

  const speakerRef = useRef<Speaker | null>(null);
  const rateRef = useRef(initialRate);

  useEffect(() => {
    const speaker = new Speaker({ onSpeakingChange: setSpeaking });
    speaker.rate = rateRef.current;
    speakerRef.current = speaker;
    return () => {
      speakerRef.current = null;
      speaker.stop();
    };
  }, []);

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    speakerRef.current?.speak(text, options);
  }, []);
  const stop = useCallback(() => {
    speakerRef.current?.stop();
    setPaused(false);
  }, []);
  const pause = useCallback(() => {
    speakerRef.current?.pause();
    setPaused(speakerRef.current?.isPaused ?? false);
  }, []);
  const resume = useCallback(() => {
    speakerRef.current?.resume();
    setPaused(false);
  }, []);
  const setRate = useCallback((rate: number) => {
    rateRef.current = rate;
    const speaker = speakerRef.current;
    if (speaker) speaker.rate = rate;
  }, []);

  return { supported, speaking, paused, speak, stop, pause, resume, setRate };
}
