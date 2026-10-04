/**
 * Normalizes a raw speech transcript so the command grammar can match it:
 * lowercase, no punctuation, collapsed whitespace, politeness prefixes
 * removed, and spelled-out numbers turned into digits ("lesson three" →
 * "lesson 3").
 */

const NUMBER_WORDS: Record<string, string> = {
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
};

const POLITENESS_PREFIXES = [/^please\s+/, /^(can|could|would) you\s+(please\s+)?/, /^hey\s+/];

export function normalize(transcript: string): string {
  let text = transcript
    .toLowerCase()
    .replace(/[.,!?;:"'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  let stripped = true;
  while (stripped) {
    stripped = false;
    for (const prefix of POLITENESS_PREFIXES) {
      const next = text.replace(prefix, '');
      if (next !== text) {
        text = next;
        stripped = true;
      }
    }
  }

  return text
    .split(' ')
    .map((word) => NUMBER_WORDS[word] ?? word)
    .join(' ');
}
