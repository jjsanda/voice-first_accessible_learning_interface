import type { Course } from '../types/course';
import { routeToHash } from '../state/useHashRoute';

export interface LessonListProps {
  course: Course;
  onReadAloud: (lessonId: string) => void;
}

export function LessonList({ course, onReadAloud }: LessonListProps) {
  return (
    <ol className="lesson-list">
      {course.lessons.map((lesson, index) => (
        <li key={lesson.id} className="card lesson-list__item">
          <div className="lesson-list__body">
            <h3>
              <a href={routeToHash({ mode: 'lessons', lessonId: lesson.id })}>
                {index + 1}. {lesson.title}
              </a>
            </h3>
            <p className="lesson-list__summary">{lesson.summary}</p>
            <p className="lesson-list__meta">{lesson.sections.length} sections</p>
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => onReadAloud(lesson.id)}
            aria-label={`Read aloud: lesson ${index + 1}, ${lesson.title}`}
          >
            Read aloud
          </button>
        </li>
      ))}
    </ol>
  );
}
