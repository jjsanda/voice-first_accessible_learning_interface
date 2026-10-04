import type { Answer, SearchResult } from '../types/answer';
import type { Course } from '../types/course';
import { loadApiKey } from '../state/settings';
import { ExtractiveEngine } from './ExtractiveEngine';

/**
 * Answers a question using the best available engine: the Anthropic engine
 * when the user has configured an API key, the offline extractive engine
 * otherwise. Any Anthropic failure (bad key, rate limit, network, timeout)
 * falls back to the extractive answer with a short notice, so asking always
 * produces something useful.
 */
export async function answerQuestion(
  course: Course,
  question: string,
  results: SearchResult[],
): Promise<Answer> {
  const extractive = new ExtractiveEngine(course.lessons.map((l) => l.title));
  const apiKey = loadApiKey();

  if (apiKey && results.length > 0) {
    try {
      // Loaded on demand so keyless users never download the Anthropic SDK.
      const { AnthropicEngine } = await import('./AnthropicEngine');
      const engine = new AnthropicEngine(apiKey);
      const signal = AbortSignal.timeout(12_000);
      return await engine.answer(question, results, signal);
    } catch {
      const fallback = await extractive.answer(question, results);
      return { ...fallback, notice: 'AI answer unavailable — showing a course excerpt instead.' };
    }
  }

  return extractive.answer(question, results);
}
