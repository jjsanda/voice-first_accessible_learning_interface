import type { Chunk } from '../retrieval/chunker';

export interface Citation {
  lessonId: string;
  lessonTitle: string;
  sectionId: string;
  sectionTitle: string;
}

export interface Answer {
  /** Text shown on screen. */
  text: string;
  /** TTS-friendly variant: no markup, citations phrased as prose. */
  spokenText: string;
  citations: Citation[];
  engine: 'extractive' | 'anthropic';
  /** False when the course doesn't cover the question and we say so. */
  grounded: boolean;
  /** Optional one-line notice, e.g. "AI answer unavailable — showing course excerpt." */
  notice?: string;
}

export interface SearchResult {
  chunk: Chunk;
  score: number;
}

/** A strategy for turning a question plus retrieved course content into an Answer. */
export interface AnswerEngine {
  readonly id: 'extractive' | 'anthropic';
  readonly label: string;
  answer(question: string, results: SearchResult[], signal?: AbortSignal): Promise<Answer>;
}
