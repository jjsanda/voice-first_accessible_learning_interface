import type { SearchResult } from '../types/answer';
import type { Chunk } from './chunker';
import { tokenize } from './tokenize';

export interface SearchIndex {
  search(query: string, k: number): SearchResult[];
}

const K1 = 1.5;
const B = 0.75;

/**
 * Classic BM25 over course chunks. Lesson and section titles are prepended to
 * the indexed text (not the displayed text) so questions using title wording
 * rank the right section highly.
 */
export function buildIndex(chunks: Chunk[]): SearchIndex {
  const docs = chunks.map((c) => tokenize(`${c.lessonTitle} ${c.sectionTitle} ${c.text}`));
  const totalLength = docs.reduce((sum, d) => sum + d.length, 0);
  const avgDocLength = docs.length > 0 ? totalLength / docs.length : 0;

  const termFrequencies = docs.map((doc) => {
    const tf = new Map<string, number>();
    for (const term of doc) tf.set(term, (tf.get(term) ?? 0) + 1);
    return tf;
  });

  const docFrequency = new Map<string, number>();
  for (const tf of termFrequencies) {
    for (const term of tf.keys()) docFrequency.set(term, (docFrequency.get(term) ?? 0) + 1);
  }

  const n = docs.length;
  const idf = (term: string): number => {
    const df = docFrequency.get(term) ?? 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  };

  return {
    search(query, k) {
      const queryTerms = [...new Set(tokenize(query))];
      if (queryTerms.length === 0 || n === 0) return [];

      const results: SearchResult[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const tf = termFrequencies[i]!;
        const docLength = docs[i]!.length;
        let score = 0;
        for (const term of queryTerms) {
          const f = tf.get(term) ?? 0;
          if (f === 0) continue;
          score +=
            (idf(term) * (f * (K1 + 1))) / (f + K1 * (1 - B + (B * docLength) / avgDocLength));
        }
        if (score > 0) results.push({ chunk: chunks[i]!, score });
      }
      return results.sort((a, b) => b.score - a.score).slice(0, k);
    },
  };
}
