import type { AskEntry } from '../state/appStore';
import { CitationList } from './CitationList';

export interface AnswerCardProps {
  entry: AskEntry;
  onSpeak: (text: string) => void;
}

export function AnswerCard({ entry, onSpeak }: AnswerCardProps) {
  const { question, answer } = entry;
  return (
    <article className="card answer-card">
      <header className="answer-card__header">
        <h3 className="answer-card__question">{question}</h3>
        <span className="answer-card__badge">
          {answer.engine === 'anthropic' ? 'AI answer' : 'Course excerpt'}
        </span>
      </header>
      {answer.notice && <p className="answer-card__notice">{answer.notice}</p>}
      <p className="answer-card__text">{answer.text}</p>
      <CitationList citations={answer.citations} />
      <div className="answer-card__actions">
        <button type="button" className="btn btn--quiet" onClick={() => onSpeak(answer.spokenText)}>
          Read aloud
        </button>
      </div>
    </article>
  );
}
