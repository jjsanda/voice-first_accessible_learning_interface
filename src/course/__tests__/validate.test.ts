import { describe, expect, it } from 'vitest';
import { CourseValidationError, validateCourse } from '../validate';
import { loadCourse } from '../loader';

function minimalCourse(): Record<string, unknown> {
  return {
    id: 'c1',
    title: 'Course',
    description: 'Desc',
    language: 'en',
    version: '1.0.0',
    lessons: [
      {
        id: 'l1',
        title: 'Lesson',
        order: 1,
        summary: 'Summary.',
        sections: [{ id: 's1', title: 'Section', content: 'Content.' }],
      },
    ],
    flashcards: [{ id: 'f1', lessonId: 'l1', front: 'Q?', back: 'A.' }],
  };
}

function problemsOf(data: unknown): string[] {
  try {
    validateCourse(data);
    return [];
  } catch (error) {
    if (error instanceof CourseValidationError) return error.problems;
    throw error;
  }
}

describe('validateCourse', () => {
  it('accepts a well-formed course', () => {
    expect(() => validateCourse(minimalCourse())).not.toThrow();
  });

  it('the bundled demo course is valid', () => {
    const course = loadCourse();
    expect(course.lessons.length).toBeGreaterThan(0);
    expect(course.flashcards.length).toBeGreaterThan(0);
  });

  it('sorts lessons by their order field', () => {
    const data = minimalCourse();
    data.lessons = [
      {
        id: 'l2',
        title: 'Second',
        order: 2,
        summary: 'S.',
        sections: [{ id: 's2', title: 'T', content: 'C.' }],
      },
      {
        id: 'l1',
        title: 'First',
        order: 1,
        summary: 'S.',
        sections: [{ id: 's1', title: 'T', content: 'C.' }],
      },
    ];
    (data.flashcards as Array<Record<string, unknown>>)[0]!.lessonId = 'l1';
    const course = validateCourse(data);
    expect(course.lessons.map((l) => l.id)).toEqual(['l1', 'l2']);
  });

  it('reports missing fields with their path', () => {
    const data = minimalCourse();
    (data.lessons as Array<Record<string, unknown>>)[0]!.title = '';
    expect(problemsOf(data)).toContain('lessons[0].title must be a non-empty string');
  });

  it('reports empty section content with a precise path', () => {
    const data = minimalCourse();
    const lesson = (data.lessons as Array<Record<string, unknown>>)[0]!;
    (lesson.sections as Array<Record<string, unknown>>)[0]!.content = '   ';
    expect(problemsOf(data)).toContain('lessons[0].sections[0].content must be a non-empty string');
  });

  it('rejects flashcards pointing at a lesson that does not exist', () => {
    const data = minimalCourse();
    (data.flashcards as Array<Record<string, unknown>>)[0]!.lessonId = 'ghost';
    expect(problemsOf(data)).toContain('flashcards[0].lessonId "ghost" does not match any lesson');
  });

  it('rejects duplicate ids', () => {
    const data = minimalCourse();
    (data.lessons as unknown[]).push({
      id: 'l1',
      title: 'Dup',
      order: 2,
      summary: 'S.',
      sections: [{ id: 's9', title: 'T', content: 'C.' }],
    });
    expect(problemsOf(data).some((p) => p.includes('"l1" is duplicated'))).toBe(true);
  });

  it('collects multiple problems in one pass', () => {
    const data = minimalCourse();
    data.title = '';
    data.language = 'fr';
    expect(problemsOf(data).length).toBeGreaterThanOrEqual(2);
  });

  it('rejects non-object input outright', () => {
    expect(() => validateCourse('nope')).toThrow(CourseValidationError);
  });
});
