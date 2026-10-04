import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SpeechRecognizer, type RecognitionError } from './recognition';
import { detectSpeechSupport } from './support';

export interface UseSpeechRecognitionOptions {
  onFinal: (transcript: string) => void;
  onError?: (error: RecognitionError) => void;
}

export interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  interimTranscript: string;
  start: () => void;
  stop: () => void;
}

/** React binding for the push-to-talk recognizer. */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions,
): UseSpeechRecognitionResult {
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const supported = useMemo(() => detectSpeechSupport().stt, []);

  // The recognizer outlives renders; it reads the latest callbacks through a
  // ref so consumers can pass fresh closures without re-creating it.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  useEffect(() => {
    const recognizer = new SpeechRecognizer({
      onInterim: (t) => setInterimTranscript(t),
      onFinal: (t) => {
        setInterimTranscript('');
        optionsRef.current.onFinal(t);
      },
      onError: (e) => {
        setInterimTranscript('');
        optionsRef.current.onError?.(e);
      },
      onListeningChange: (isListening) => {
        setListening(isListening);
        if (!isListening) setInterimTranscript('');
      },
    });
    recognizerRef.current = recognizer;
    return () => {
      recognizerRef.current = null;
      recognizer.abort();
    };
  }, []);

  const start = useCallback(() => recognizerRef.current?.start(), []);
  const stop = useCallback(() => recognizerRef.current?.stop(), []);

  return { supported, listening, interimTranscript, start, stop };
}
