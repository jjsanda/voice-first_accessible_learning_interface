import Anthropic from '@anthropic-ai/sdk';
import type { Answer, AnswerEngine, Citation, SearchResult } from '../types/answer';

const MODEL = 'claude-opus-4-8';

const SYSTEM_PROMPT = `You are the answer engine of a voice-first learning app. You receive numbered course excerpts and a learner's question.

Rules:
- Answer ONLY from the excerpts. Never use outside knowledge.
- If the excerpts do not answer the question, reply exactly: "The course does not cover this."
- Answer in 2 to 4 short sentences that sound natural when read aloud by text-to-speech. No lists, no markdown, no symbols.
- After each claim, cite the excerpt it came from with a marker like [S1] or [S2].`;

/**
 * Optional LLM answer engine. Calls the Anthropic API directly from the
 * browser with the user's own key (dangerouslyAllowBrowser makes the SDK send
 * the required opt-in header). Retrieval still happens locally — only the
 * question and the matched course excerpts are sent.
 */
export class AnthropicEngine implements AnswerEngine {
  readonly id = 'anthropic' as const;
  readonly label = 'AI answer (Claude)';

  constructor(private readonly apiKey: string) {}

  async answer(question: string, results: SearchResult[], signal?: AbortSignal): Promise<Answer> {
    const client = new Anthropic({ apiKey: this.apiKey, dangerouslyAllowBrowser: true });

    const excerpts = results
      .map((r, i) => {
        const c = r.chunk;
        return `[S${i + 1}] (${c.lessonTitle} — ${c.sectionTitle})\n${c.text}`;
      })
      .join('\n\n');

    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Course excerpts:\n\n${excerpts}\n\nQuestion: ${question}`,
          },
        ],
      },
      { signal },
    );

    if (response.stop_reason !== 'end_turn' && response.stop_reason !== 'stop_sequence') {
      throw new Error(`Unexpected stop reason: ${response.stop_reason ?? 'none'}`);
    }

    const raw = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join(' ')
      .trim();
    if (!raw) throw new Error('Empty response');

    // Resolve [Sn] markers back to the excerpts they reference.
    const cited = new Set<number>();
    for (const match of raw.matchAll(/\[S(\d+)\]/g)) {
      const index = Number.parseInt(match[1]!, 10) - 1;
      if (index >= 0 && index < results.length) cited.add(index);
    }
    // Long sections are split into several chunks sharing one sectionId, so
    // dedupe by section — two chunks of one section are one source.
    const citations: Citation[] = [];
    for (const i of [...cited].sort((a, b) => a - b)) {
      const c = results[i]!.chunk;
      if (!citations.some((existing) => existing.sectionId === c.sectionId)) {
        citations.push({
          lessonId: c.lessonId,
          lessonTitle: c.lessonTitle,
          sectionId: c.sectionId,
          sectionTitle: c.sectionTitle,
        });
      }
    }

    const clean = raw
      .replace(/\s*\[S\d+\]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    const grounded = !clean.startsWith('The course does not cover this');

    return {
      text: clean,
      spokenText: clean,
      citations,
      engine: this.id,
      grounded,
    };
  }
}
