/** A complete course: ordered lessons plus a pool of flashcards. */
export interface Course {
  id: string;
  title: string;
  description: string;
  language: 'en';
  version: string;
  lessons: Lesson[];
  flashcards: Flashcard[];
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  /** One-sentence summary, spoken when the lesson is announced. */
  summary: string;
  sections: Section[];
}

export interface Section {
  id: string;
  title: string;
  /** Plain prose, paragraphs separated by blank lines. Written to read well aloud. */
  content: string;
}

export interface Flashcard {
  id: string;
  /** Lesson this card belongs to; must reference an existing lesson id. */
  lessonId: string;
  front: string;
  back: string;
  tags?: string[];
}
