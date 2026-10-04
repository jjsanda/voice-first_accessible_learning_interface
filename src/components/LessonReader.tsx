import type { Lesson } from '../types/course';
import { routeToHash } from '../state/useHashRoute';

export interface LessonReaderProps {
  lesson: Lesson;
  sectionIndex: number;
  speaking: boolean;
  onNavigateSection: (index: number) => void;
  onReadAloud: () => void;
  onStop: () => void;
}

export function LessonReader({
  lesson,
  sectionIndex,
  speaking,
  onNavigateSection,
  onReadAloud,
  onStop,
}: LessonReaderProps) {
  const section = lesson.sections[Math.min(sectionIndex, lesson.sections.length - 1)]!;
  const current = lesson.sections.indexOf(section);
  const atStart = current === 0;
  const atEnd = current >= lesson.sections.length - 1;

  return (
    <article className="lesson-reader">
      <p>
        <a href={routeToHash({ mode: 'lessons' })}>← All lessons</a>
      </p>
      <p className="lesson-reader__progress">
        Section {current + 1} of {lesson.sections.length}
      </p>

      <nav aria-label="Sections in this lesson">
        <ol className="lesson-reader__toc">
          {lesson.sections.map((s, i) => (
            <li key={s.id}>
              <a
                href={routeToHash({ mode: 'lessons', lessonId: lesson.id, sectionIndex: i })}
                aria-current={i === current ? 'true' : undefined}
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section className="card lesson-reader__section" aria-label={section.title}>
        <h2>{section.title}</h2>
        {section.content.split(/\n\n+/).map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </section>

      <div className="lesson-reader__controls">
        {/* aria-disabled (not disabled) keeps these focusable, so keyboard
            focus survives reaching either end of the lesson. */}
        <button
          type="button"
          className="btn btn--quiet"
          aria-disabled={atStart}
          onClick={() => {
            if (!atStart) onNavigateSection(current - 1);
          }}
        >
          ← Previous section
        </button>
        <button
          type="button"
          className={speaking ? 'btn' : 'btn btn--primary'}
          onClick={speaking ? onStop : onReadAloud}
        >
          {speaking ? 'Stop reading' : 'Read aloud'}
        </button>
        <button
          type="button"
          className="btn btn--quiet"
          aria-disabled={atEnd}
          onClick={() => {
            if (!atEnd) onNavigateSection(current + 1);
          }}
        >
          Next section →
        </button>
      </div>
    </article>
  );
}
