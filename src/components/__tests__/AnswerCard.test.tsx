import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { loadCourse } from '../../course/loader';
import { AppStoreProvider } from '../../state/appStore';
import { AnswerCard } from '../AnswerCard';

function withStore(children: ReactNode) {
  return <AppStoreProvider course={loadCourse()}>{children}</AppStoreProvider>;
}

const course = loadCourse();
const lesson = course.lessons[0]!;
const section = lesson.sections[0]!;

const entry = {
  id: 1,
  question: 'What is Big-O?',
  answer: {
    text: 'Big-O describes how running time grows.',
    spokenText: 'From the course: Big-O describes how running time grows.',
    citations: [
      {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        sectionId: section.id,
        sectionTitle: section.title,
      },
    ],
    engine: 'extractive' as const,
    grounded: true,
  },
};

describe('AnswerCard', () => {
  it('renders question, answer and engine badge', () => {
    render(withStore(<AnswerCard entry={entry} onSpeak={vi.fn()} />));
    expect(screen.getByText('What is Big-O?')).toBeInTheDocument();
    expect(screen.getByText(/running time grows/)).toBeInTheDocument();
    expect(screen.getByText('Course excerpt')).toBeInTheDocument();
  });

  it('links each citation into the lesson reader', () => {
    render(withStore(<AnswerCard entry={entry} onSpeak={vi.fn()} />));
    const link = screen.getByRole('link', {
      name: `${lesson.title} → ${section.title}`,
    });
    expect(link).toHaveAttribute('href', `#/lessons/${lesson.id}/0`);
  });

  it('reads the answer aloud on request', async () => {
    const onSpeak = vi.fn();
    render(withStore(<AnswerCard entry={entry} onSpeak={onSpeak} />));
    await userEvent.click(screen.getByRole('button', { name: /read aloud/i }));
    expect(onSpeak).toHaveBeenCalledWith(entry.answer.spokenText);
  });

  it('shows the AI badge and fallback notice when present', () => {
    const aiEntry = {
      ...entry,
      answer: { ...entry.answer, engine: 'anthropic' as const, notice: undefined },
    };
    render(withStore(<AnswerCard entry={aiEntry} onSpeak={vi.fn()} />));
    expect(screen.getByText('AI answer')).toBeInTheDocument();
  });
});
