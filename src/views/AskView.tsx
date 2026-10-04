import { useState } from 'react';
import { AnswerCard } from '../components/AnswerCard';
import { useAppStore } from '../state/appStore';

export interface AskViewProps {
  onAsk: (question: string) => void;
  onSpeak: (text: string) => void;
}

export function AskView({ onAsk, onSpeak }: AskViewProps) {
  const { state } = useAppStore();
  const [question, setQuestion] = useState('');

  return (
    <div>
      <h1 tabIndex={-1} data-view-heading>
        Ask a question
      </h1>
      <p>
        Speak your question using the microphone below, or type it here. Answers come from the
        course content, with sources you can follow.
      </p>

      <form
        className="ask__form"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = question.trim();
          if (!trimmed) return;
          onAsk(trimmed);
          setQuestion('');
        }}
      >
        <label htmlFor="ask-input" className="visually-hidden">
          Your question
        </label>
        <input
          id="ask-input"
          type="text"
          placeholder="For example: how does binary search work?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn--primary"
          disabled={!question.trim() || state.askStatus === 'thinking'}
        >
          {state.askStatus === 'thinking' ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      {state.askHistory.length > 0 && (
        <section aria-label="Answers" className="ask__history">
          {state.askHistory.map((entry) => (
            <AnswerCard key={entry.id} entry={entry} onSpeak={onSpeak} />
          ))}
        </section>
      )}
    </div>
  );
}
