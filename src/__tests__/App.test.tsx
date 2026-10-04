import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App';

// The dialog element isn't implemented in jsdom; stub the modal methods.
beforeEach(() => {
  window.location.hash = '#/';
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
});

describe('App (integration, real course data)', () => {
  it('renders the home view with the three entry points', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { level: 1, name: /learn hands-free/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask a question' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse lessons' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start the quiz' })).toBeInTheDocument();
  });

  it('answers a typed question from the course with citations', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Ask a question' }));

    const input = await screen.findByLabelText(/your question/i);
    await userEvent.type(input, 'How do hash tables handle collisions?');
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));

    const answers = await screen.findByRole('region', { name: 'Answers' });
    const article = within(answers).getAllByRole('article')[0]!;
    expect(within(article).getByText(/collision resolution strategy/i)).toBeInTheDocument();
    expect(within(article).getByText('Course excerpt')).toBeInTheDocument();
    expect(within(article).getAllByRole('link').length).toBeGreaterThan(0);
  });

  it('is honest when the course cannot answer', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Ask a question' }));
    const input = await screen.findByLabelText(/your question/i);
    await userEvent.type(input, 'What is the capital of France?');
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
    expect(await screen.findByText(/couldn't find that in this course/i)).toBeInTheDocument();
  });

  it('navigates to lessons and shows the course lesson list', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Browse lessons' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Lessons' })).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /read aloud: lesson/i }).length,
    ).toBeGreaterThanOrEqual(6);
  });

  it('runs a full flashcard review by buttons alone', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Start the quiz' }));

    // A session starts automatically with due/unseen cards.
    expect(await screen.findByText(/card 1 of/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /show answer/i }));
    await userEvent.click(screen.getByRole('button', { name: /got it right/i }));
    expect(await screen.findByText(/card 2 of/i)).toBeInTheDocument();
  });

  it('has a skip link to the main content', () => {
    render(<App />);
    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip).toHaveAttribute('href', '#main');
  });

  it('opens the voice command help from the HUD', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Commands' }));
    expect(screen.getByRole('heading', { name: 'Voice commands' })).toBeInTheDocument();
  });
});
