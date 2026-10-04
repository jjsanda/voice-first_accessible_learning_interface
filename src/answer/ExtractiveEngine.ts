import type { Answer, AnswerEngine, Citation, SearchResult } from '../types/answer';
import { tokenize } from '../retrieval/tokenize';
import { splitSentences } from '../utils/sentences';

/**
 * Below this BM25 top score the match is likely noise, so instead of quoting
 * something irrelevant we answer honestly that the course doesn't cover it.
 */
const RELEVANCE_THRESHOLD = 1.0;

const MAX_CHUNKS = 4;
const MAX_SENTENCES = 3;

/** Chunks scoring below this fraction of the best chunk are ignored. */
const CHUNK_SCORE_RATIO = 0.45;

/** Sentences scoring below this fraction of the best sentence are dropped. */
const SENTENCE_SCORE_RATIO = 0.55;

interface ScoredSentence {
  sentence: string;
  score: number;
  chunkIndex: number;
  position: number;
}

/**
 * Zero-configuration answer engine: quotes the most relevant sentences from
 * the retrieved course sections, with citations. Works entirely offline.
 */
export class ExtractiveEngine implements AnswerEngine {
  readonly id = 'extractive' as const;
  readonly label = 'Course excerpts';

  constructor(private readonly lessonTitles: string[]) {}

  answer(question: string, results: SearchResult[]): Promise<Answer> {
    const bestScore = results[0]?.score ?? 0;
    if (results.length === 0 || bestScore < RELEVANCE_THRESHOLD) {
      return Promise.resolve(this.miss());
    }
    const top = results
      .slice(0, MAX_CHUNKS)
      .filter((r) => r.score >= bestScore * CHUNK_SCORE_RATIO);

    const queryTerms = new Set(tokenize(question));
    const scored: ScoredSentence[] = [];
    top.forEach((result, chunkIndex) => {
      // Sentences inherit their chunk's retrieval confidence, so a weakly
      // matching section can't inject off-topic sentences into the answer.
      const chunkWeight = Math.pow(result.score / bestScore, 0.7);
      const sentences = splitSentences(result.chunk.text.replace(/\n+/g, ' '));
      sentences.forEach((sentence, position) => {
        const terms = new Set(tokenize(sentence));
        let overlap = 0;
        for (const term of queryTerms) if (terms.has(term)) overlap += 1;
        if (overlap === 0) return;
        // Normalize by sentence length so long sentences don't win on bulk;
        // small boost for the sentence that opens a section.
        const score =
          (overlap / Math.sqrt(terms.size || 1)) * chunkWeight + (position === 0 ? 0.05 : 0);
        scored.push({ sentence, score, chunkIndex, position });
      });
    });

    if (scored.length === 0) return Promise.resolve(this.miss());

    scored.sort((a, b) => b.score - a.score);
    const bestSentenceScore = scored[0]!.score;
    const picked = scored
      .filter((s) => s.score >= bestSentenceScore * SENTENCE_SCORE_RATIO)
      .slice(0, MAX_SENTENCES)
      .sort((a, b) => a.chunkIndex - b.chunkIndex || a.position - b.position);

    const citations: Citation[] = [];
    for (const { chunkIndex } of picked) {
      const { chunk } = top[chunkIndex]!;
      if (!citations.some((c) => c.sectionId === chunk.sectionId)) {
        citations.push({
          lessonId: chunk.lessonId,
          lessonTitle: chunk.lessonTitle,
          sectionId: chunk.sectionId,
          sectionTitle: chunk.sectionTitle,
        });
      }
    }

    const body = picked.map((s) => s.sentence).join(' ');
    const source = citations[0]!;
    return Promise.resolve({
      text: body,
      spokenText: `From ${source.lessonTitle}, ${source.sectionTitle}: ${body}`,
      citations,
      engine: this.id,
      grounded: true,
    });
  }

  private miss(): Answer {
    const suggestions = this.lessonTitles.slice(0, 3).join('; ');
    const text = `I couldn't find that in this course. Try asking about one of its topics, such as: ${suggestions}.`;
    return {
      text,
      spokenText: text,
      citations: [],
      engine: this.id,
      grounded: false,
    };
  }
}
