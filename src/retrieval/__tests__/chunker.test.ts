import { describe, expect, it } from 'vitest';
import type { Course } from '../../types/course';
import { chunkCourse } from '../chunker';

function courseWith(content: string): Course {
  return {
    id: 'test',
    title: 'Test Course',
    description: 'Test',
    language: 'en',
    version: '1.0.0',
    lessons: [
      {
        id: 'l1',
        title: 'Lesson One',
        order: 1,
        summary: 'Summary.',
        sections: [{ id: 's1', title: 'Section One', content }],
      },
    ],
    flashcards: [],
  };
}

describe('chunkCourse', () => {
  it('produces one chunk per short section with full metadata', () => {
    const chunks = chunkCourse(courseWith('Short content.'));
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      id: 's1',
      lessonId: 'l1',
      lessonTitle: 'Lesson One',
      sectionId: 's1',
      sectionTitle: 'Section One',
      text: 'Short content.',
    });
  });

  it('splits long sections at paragraph boundaries', () => {
    const paragraph = 'This sentence is repeated to make a long paragraph. '.repeat(12).trim();
    const content = [paragraph, paragraph, paragraph].join('\n\n');
    const chunks = chunkCourse(courseWith(content));
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.sectionId).toBe('s1');
      expect(c.text.length).toBeLessThanOrEqual(1300);
    }
    const ids = chunks.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('carries an overlapping sentence between adjacent chunks', () => {
    const first =
      'First paragraph filler text that goes on for quite a while. The key overlap sentence lives here.';
    const padding = 'Padding sentence to push the length over the limit. '.repeat(22).trim();
    const chunks = chunkCourse(courseWith(`${first}\n\n${padding}\n\n${padding}`));
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[1]?.text).toContain('The key overlap sentence lives here.');
  });

  it('walks every lesson and section in order', () => {
    const course = courseWith('First.');
    course.lessons.push({
      id: 'l2',
      title: 'Lesson Two',
      order: 2,
      summary: 'Summary.',
      sections: [
        { id: 's2', title: 'A', content: 'Second.' },
        { id: 's3', title: 'B', content: 'Third.' },
      ],
    });
    const chunks = chunkCourse(course);
    expect(chunks.map((c) => c.sectionId)).toEqual(['s1', 's2', 's3']);
  });
});
