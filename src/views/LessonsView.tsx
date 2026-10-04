import { LessonList } from '../components/LessonList';
import { LessonReader } from '../components/LessonReader';
import { useAppStore } from '../state/appStore';
import type { Route } from '../state/useHashRoute';

export interface LessonsViewProps {
  route: Route;
  speaking: boolean;
  onReadLesson: (lessonId: string, sectionIndex?: number) => void;
  onNavigateSection: (lessonId: string, index: number) => void;
  onStopSpeaking: () => void;
}

export function LessonsView({
  route,
  speaking,
  onReadLesson,
  onNavigateSection,
  onStopSpeaking,
}: LessonsViewProps) {
  const { course } = useAppStore();
  const lesson = route.lessonId ? course.lessons.find((l) => l.id === route.lessonId) : undefined;

  if (route.lessonId && !lesson) {
    return (
      <div>
        <h1 tabIndex={-1} data-view-heading>
          Lesson not found
        </h1>
        <p>
          There is no lesson called “{route.lessonId}”. <a href="#/lessons">Back to all lessons.</a>
        </p>
      </div>
    );
  }

  if (lesson) {
    const sectionIndex = route.sectionIndex ?? 0;
    return (
      <div>
        <h1 tabIndex={-1} data-view-heading>
          {lesson.title}
        </h1>
        <LessonReader
          lesson={lesson}
          sectionIndex={sectionIndex}
          speaking={speaking}
          onNavigateSection={(index) => onNavigateSection(lesson.id, index)}
          onReadAloud={() => onReadLesson(lesson.id, sectionIndex)}
          onStop={onStopSpeaking}
        />
      </div>
    );
  }

  return (
    <div>
      <h1 tabIndex={-1} data-view-heading>
        Lessons
      </h1>
      <p>
        Open a lesson to read it yourself, or press “Read aloud” — you can also say “read lesson
        two” from anywhere.
      </p>
      <LessonList course={course} onReadAloud={(id) => onReadLesson(id)} />
    </div>
  );
}
