import type { Intent } from '../types/commands';
import { useAppStore } from '../state/appStore';

export function HomeView({ onIntent }: { onIntent: (intent: Intent) => void }) {
  const { course } = useAppStore();

  return (
    <div>
      <h1 tabIndex={-1} data-view-heading>
        Learn hands-free
      </h1>
      <p className="home__lede">
        Ask questions out loud, review flashcards by voice, and have lessons read to you — or do it
        all with the keyboard. Currently loaded: <strong>{course.title}</strong>.
      </p>

      <div className="home__entries">
        <section className="card home__entry" aria-labelledby="entry-ask">
          <h2 id="entry-ask">Ask a question</h2>
          <p>Speak or type a question and get an answer straight from the course, with sources.</p>
          <p className="home__hint">Try saying: “What is Big-O notation?”</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onIntent({ type: 'GO_TO', target: 'ask' })}
          >
            Ask a question
          </button>
        </section>
        <section className="card home__entry" aria-labelledby="entry-lessons">
          <h2 id="entry-lessons">Listen to lessons</h2>
          <p>Browse the course and have any lesson read aloud, section by section.</p>
          <p className="home__hint">Try saying: “Read lesson one”</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onIntent({ type: 'GO_TO', target: 'lessons' })}
          >
            Browse lessons
          </button>
        </section>
        <section className="card home__entry" aria-labelledby="entry-quiz">
          <h2 id="entry-quiz">Quiz yourself</h2>
          <p>Flashcards with spaced repetition — cards you miss come back sooner.</p>
          <p className="home__hint">Try saying: “Go to the quiz”</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onIntent({ type: 'GO_TO', target: 'quiz' })}
          >
            Start the quiz
          </button>
        </section>
      </div>

      <p className="home__course-note">{course.description}</p>
    </div>
  );
}
