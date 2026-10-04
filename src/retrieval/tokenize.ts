/**
 * Tokenization for the search index: lowercase, strip punctuation, drop
 * stopwords, then apply a light suffix stemmer so "sorting", "sorted" and
 * "sorts" all match "sort". Deliberately tiny — no dependencies.
 */

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'between',
  'but',
  'by',
  'can',
  'do',
  'does',
  'for',
  'from',
  'has',
  'have',
  'how',
  'if',
  'in',
  'is',
  'it',
  'its',
  'me',
  'mean',
  'meaning',
  'means',
  'my',
  'of',
  'on',
  'or',
  'so',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'to',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'will',
  'with',
  'work',
  'works',
  'you',
  'your',
]);

/** Suffix rules applied in order; first match wins. */
const SUFFIX_RULES: Array<[suffix: string, replacement: string]> = [
  ['ies', 'y'],
  ['sses', 'ss'],
  ['ches', 'ch'],
  ['shes', 'sh'],
  ['xes', 'x'],
  ['zes', 'z'],
  ['ing', ''],
  ['ed', ''],
  ['es', 'e'],
  ['s', ''],
];

const MIN_STEM_LENGTH = 3;

export function stem(word: string): string {
  for (const [suffix, replacement] of SUFFIX_RULES) {
    if (word.endsWith(suffix)) {
      const stemmed = word.slice(0, word.length - suffix.length) + replacement;
      if (stemmed.length >= MIN_STEM_LENGTH) return stemmed;
      return word;
    }
  }
  return word;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map(stem);
}
