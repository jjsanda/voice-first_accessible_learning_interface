import type { Course } from '../types/course';
import { splitSentences } from '../utils/sentences';

/** A searchable unit of course content: a section, or part of a long one. */
export interface Chunk {
  id: string;
  lessonId: string;
  lessonTitle: string;
  sectionId: string;
  sectionTitle: string;
  text: string;
}

/** Sections longer than this are split at paragraph boundaries. */
const MAX_CHUNK_LENGTH = 1200;

export function chunkCourse(course: Course): Chunk[] {
  const chunks: Chunk[] = [];
  for (const lesson of course.lessons) {
    for (const section of lesson.sections) {
      const meta = {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        sectionId: section.id,
        sectionTitle: section.title,
      };
      if (section.content.length <= MAX_CHUNK_LENGTH) {
        chunks.push({ id: section.id, ...meta, text: section.content });
        continue;
      }
      // Split at paragraph boundaries, carrying the previous paragraph's last
      // sentence into the next chunk so context spanning a break stays findable.
      const paragraphs = section.content.split(/\n\n+/);
      let part = 0;
      let buffer = '';
      let overlap = '';
      const flush = () => {
        if (!buffer) return;
        chunks.push({ id: `${section.id}-${part}`, ...meta, text: buffer });
        overlap = splitSentences(buffer).at(-1) ?? '';
        part += 1;
        buffer = '';
      };
      for (const paragraph of paragraphs) {
        const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
        if (candidate.length > MAX_CHUNK_LENGTH && buffer) {
          flush();
          buffer = overlap ? `${overlap}\n\n${paragraph}` : paragraph;
        } else {
          buffer = candidate;
        }
      }
      flush();
    }
  }
  return chunks;
}
