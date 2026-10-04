import type { Course, Flashcard, Lesson, Section } from '../types/course';

export class CourseValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Invalid course:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    this.name = 'CourseValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Structural validation with human-readable, path-precise error messages.
 * Throws CourseValidationError listing every problem found, so course authors
 * can fix them all in one pass.
 */
export function validateCourse(data: unknown): Course {
  const problems: string[] = [];
  const need = (condition: boolean, message: string) => {
    if (!condition) problems.push(message);
    return condition;
  };
  const nonEmptyString = (value: unknown, path: string) =>
    need(
      typeof value === 'string' && value.trim().length > 0,
      `${path} must be a non-empty string`,
    );

  if (!isRecord(data)) {
    throw new CourseValidationError(['course must be a JSON object']);
  }

  nonEmptyString(data.id, 'id');
  nonEmptyString(data.title, 'title');
  nonEmptyString(data.description, 'description');
  nonEmptyString(data.version, 'version');
  need(data.language === 'en', "language must be 'en'");

  const sectionIds = new Set<string>();
  const lessonIds = new Set<string>();

  if (
    need(
      Array.isArray(data.lessons) && data.lessons.length > 0,
      'lessons must be a non-empty array',
    )
  ) {
    (data.lessons as unknown[]).forEach((lesson, i) => {
      const path = `lessons[${i}]`;
      if (!isRecord(lesson)) {
        problems.push(`${path} must be an object`);
        return;
      }
      if (nonEmptyString(lesson.id, `${path}.id`)) {
        const id = lesson.id as string;
        if (lessonIds.has(id)) problems.push(`${path}.id "${id}" is duplicated`);
        lessonIds.add(id);
      }
      nonEmptyString(lesson.title, `${path}.title`);
      nonEmptyString(lesson.summary, `${path}.summary`);
      need(typeof lesson.order === 'number', `${path}.order must be a number`);
      if (
        need(
          Array.isArray(lesson.sections) && lesson.sections.length > 0,
          `${path}.sections must be a non-empty array`,
        )
      ) {
        (lesson.sections as unknown[]).forEach((section, j) => {
          const sPath = `${path}.sections[${j}]`;
          if (!isRecord(section)) {
            problems.push(`${sPath} must be an object`);
            return;
          }
          if (nonEmptyString(section.id, `${sPath}.id`)) {
            const id = section.id as string;
            if (sectionIds.has(id)) problems.push(`${sPath}.id "${id}" is duplicated`);
            sectionIds.add(id);
          }
          nonEmptyString(section.title, `${sPath}.title`);
          nonEmptyString(section.content, `${sPath}.content`);
        });
      }
    });
  }

  const cardIds = new Set<string>();
  if (need(Array.isArray(data.flashcards), 'flashcards must be an array')) {
    (data.flashcards as unknown[]).forEach((card, i) => {
      const path = `flashcards[${i}]`;
      if (!isRecord(card)) {
        problems.push(`${path} must be an object`);
        return;
      }
      if (nonEmptyString(card.id, `${path}.id`)) {
        const id = card.id as string;
        if (cardIds.has(id)) problems.push(`${path}.id "${id}" is duplicated`);
        cardIds.add(id);
      }
      nonEmptyString(card.front, `${path}.front`);
      nonEmptyString(card.back, `${path}.back`);
      if (nonEmptyString(card.lessonId, `${path}.lessonId`)) {
        const lessonId = card.lessonId as string;
        if (!lessonIds.has(lessonId)) {
          problems.push(`${path}.lessonId "${lessonId}" does not match any lesson`);
        }
      }
      if (card.tags !== undefined) {
        need(
          Array.isArray(card.tags) && card.tags.every((t) => typeof t === 'string'),
          `${path}.tags must be an array of strings`,
        );
      }
    });
  }

  if (problems.length > 0) throw new CourseValidationError(problems);

  const course = data as unknown as Course;
  return {
    ...course,
    lessons: [...course.lessons].sort((a, b) => a.order - b.order),
    flashcards: course.flashcards,
  };
}

export type { Course, Lesson, Section, Flashcard };
