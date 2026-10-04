import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchResult } from '../../types/answer';

const createMock = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: createMock };
      constructor(public options: Record<string, unknown>) {
        constructorOptions = options;
      }
    },
  };
});

let constructorOptions: Record<string, unknown> = {};

import { AnthropicEngine } from '../AnthropicEngine';

function results(): SearchResult[] {
  return [
    {
      score: 5,
      chunk: {
        id: 's1',
        lessonId: 'sorting',
        lessonTitle: 'Sorting Algorithms',
        sectionId: 'quicksort',
        sectionTitle: 'Quicksort',
        text: 'Quicksort runs in O(n log n) time on average.',
      },
    },
    {
      score: 3,
      chunk: {
        id: 's2',
        lessonId: 'big-o',
        lessonTitle: 'Big-O Notation',
        sectionId: 'classes',
        sectionTitle: 'Complexity Classes',
        text: 'O(n log n) is called linearithmic time.',
      },
    },
  ];
}

function apiResponse(text: string, stopReason = 'end_turn') {
  return { stop_reason: stopReason, content: [{ type: 'text', text }] };
}

describe('AnthropicEngine', () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it('opts into browser usage explicitly and never sends the key elsewhere', async () => {
    createMock.mockResolvedValue(apiResponse('Answer. [S1]'));
    const engine = new AnthropicEngine('sk-ant-test');
    await engine.answer('how fast is quicksort', results());
    expect(constructorOptions).toMatchObject({
      apiKey: 'sk-ant-test',
      dangerouslyAllowBrowser: true,
    });
  });

  it('sends numbered excerpts with lesson and section titles as context', async () => {
    createMock.mockResolvedValue(apiResponse('Answer. [S1]'));
    const engine = new AnthropicEngine('sk-ant-test');
    await engine.answer('how fast is quicksort', results());

    const request = createMock.mock.calls[0]![0] as {
      system: string;
      messages: Array<{ content: string }>;
    };
    const content = request.messages[0]!.content;
    expect(content).toContain('[S1] (Sorting Algorithms — Quicksort)');
    expect(content).toContain('[S2] (Big-O Notation — Complexity Classes)');
    expect(content).toContain('Question: how fast is quicksort');
    expect(request.system).toContain('ONLY from the excerpts');
  });

  it('parses [Sn] markers into citations and strips them from the text', async () => {
    createMock.mockResolvedValue(
      apiResponse('Quicksort is fast on average. [S1] This is linearithmic time. [S2]'),
    );
    const engine = new AnthropicEngine('sk-ant-test');
    const answer = await engine.answer('how fast is quicksort', results());

    expect(answer.text).not.toContain('[S1]');
    expect(answer.spokenText).not.toContain('[S');
    expect(answer.citations.map((c) => c.sectionId)).toEqual(['quicksort', 'classes']);
    expect(answer.engine).toBe('anthropic');
    expect(answer.grounded).toBe(true);
  });

  it('reports an ungrounded answer when the course does not cover the question', async () => {
    createMock.mockResolvedValue(apiResponse('The course does not cover this.'));
    const engine = new AnthropicEngine('sk-ant-test');
    const answer = await engine.answer('what is photosynthesis', results());
    expect(answer.grounded).toBe(false);
    expect(answer.citations).toEqual([]);
  });

  it('throws on unexpected stop reasons so the factory can fall back', async () => {
    createMock.mockResolvedValue(apiResponse('partial…', 'max_tokens'));
    const engine = new AnthropicEngine('sk-ant-test');
    await expect(engine.answer('question', results())).rejects.toThrow(/stop reason/i);
  });

  it('propagates API failures (bad key, rate limit) for graceful fallback', async () => {
    createMock.mockRejectedValue(new Error('401 authentication_error'));
    const engine = new AnthropicEngine('sk-ant-bad');
    await expect(engine.answer('question', results())).rejects.toThrow();
  });

  it('ignores citation markers that reference non-existent excerpts', async () => {
    createMock.mockResolvedValue(apiResponse('Answer. [S9]'));
    const engine = new AnthropicEngine('sk-ant-test');
    const answer = await engine.answer('question', results());
    expect(answer.citations).toEqual([]);
  });
});
