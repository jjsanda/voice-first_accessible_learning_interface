/**
 * Sentence splitting shared by the extractive answer engine (which scores and
 * quotes individual sentences) and the speech synthesis queue (which speaks
 * long text one sentence at a time to avoid browser cutoffs).
 */

const ABBREVIATIONS = new Set(['e.g', 'i.e', 'etc', 'vs', 'dr', 'mr', 'mrs', 'ms', 'prof', 'no']);

export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i] as string;
    current += ch;
    if (ch === '.' || ch === '!' || ch === '?') {
      const next = text[i + 1];
      const isEnd = next === undefined || next === ' ' || next === '\n';
      const lastWord = (current.trimEnd().slice(0, -1).split(/\s+/).pop() ?? '').toLowerCase();
      if (isEnd && !ABBREVIATIONS.has(lastWord)) {
        const trimmed = current.trim();
        if (trimmed) sentences.push(trimmed);
        current = '';
      }
    }
  }
  const rest = current.trim();
  if (rest) sentences.push(rest);
  return sentences;
}

/**
 * Split text into TTS-sized pieces: sentences, further divided at commas or
 * word boundaries when a single sentence exceeds maxLength.
 */
export function splitForSpeech(text: string, maxLength = 200): string[] {
  const pieces: string[] = [];
  for (const paragraph of text.split(/\n+/)) {
    for (const sentence of splitSentences(paragraph)) {
      if (sentence.length <= maxLength) {
        pieces.push(sentence);
        continue;
      }
      let remaining = sentence;
      while (remaining.length > maxLength) {
        const window = remaining.slice(0, maxLength);
        const cut = Math.max(window.lastIndexOf(', '), window.lastIndexOf(' '));
        const at = cut > 0 ? cut + 1 : maxLength;
        pieces.push(remaining.slice(0, at).trim());
        remaining = remaining.slice(at).trim();
      }
      if (remaining) pieces.push(remaining);
    }
  }
  return pieces.filter((p) => p.length > 0);
}
