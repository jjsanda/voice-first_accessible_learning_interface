import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Flashcard } from '../Flashcard';

const card = {
  id: 'c1',
  lessonId: 'l1',
  front: 'What does LIFO stand for?',
  back: 'Last in, first out.',
};

function renderCard(revealed: boolean) {
  const onFlip = vi.fn();
  const onGrade = vi.fn();
  const onSkip = vi.fn();
  render(
    <Flashcard
      card={card}
      revealed={revealed}
      position={2}
      total={10}
      onFlip={onFlip}
      onGrade={onGrade}
      onSkip={onSkip}
    />,
  );
  return { onFlip, onGrade, onSkip };
}

describe('Flashcard', () => {
  it('shows the question side with flip and skip controls', () => {
    renderCard(false);
    expect(screen.getByText('What does LIFO stand for?')).toBeInTheDocument();
    expect(screen.queryByText('Last in, first out.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show answer/i })).toBeInTheDocument();
    expect(screen.getByText('Card 2 of 10')).toBeInTheDocument();
  });

  it('flips via the button', async () => {
    const { onFlip } = renderCard(false);
    await userEvent.click(screen.getByRole('button', { name: /show answer/i }));
    expect(onFlip).toHaveBeenCalled();
  });

  it('shows the answer side with grading controls when revealed', () => {
    renderCard(true);
    expect(screen.getByText('Last in, first out.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /got it right/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /got it wrong/i })).toBeInTheDocument();
  });

  it('reports grading choices', async () => {
    const { onGrade } = renderCard(true);
    await userEvent.click(screen.getByRole('button', { name: /got it right/i }));
    expect(onGrade).toHaveBeenCalledWith(true);
    await userEvent.click(screen.getByRole('button', { name: /got it wrong/i }));
    expect(onGrade).toHaveBeenCalledWith(false);
  });

  it('is fully keyboard operable', async () => {
    const { onFlip } = renderCard(false);
    await userEvent.tab(); // Skip
    await userEvent.tab(); // Show answer
    expect(screen.getByRole('button', { name: /show answer/i })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onFlip).toHaveBeenCalled();
  });
});
