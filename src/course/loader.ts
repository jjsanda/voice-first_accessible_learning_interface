import type { Course } from '../types/course';
import csFundamentals from './data/cs-fundamentals.json';
import { validateCourse } from './validate';

let cached: Course | null = null;

/**
 * Loads the bundled course, validating it once. This is the extension point
 * for custom courses: pass any object matching the documented course format
 * (see docs/COURSE_FORMAT.md) and it will be validated the same way.
 */
export function loadCourse(source?: unknown): Course {
  if (source !== undefined) return validateCourse(source);
  cached ??= validateCourse(csFundamentals);
  return cached;
}
