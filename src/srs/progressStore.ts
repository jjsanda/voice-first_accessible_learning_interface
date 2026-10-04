import { readStorage, writeStorage } from '../utils/storage';
import type { CardProgress } from './scheduler';

const KEY = 'progress';

export function loadProgress(): Map<string, CardProgress> {
  const entries = readStorage<CardProgress[]>(KEY, []);
  // Guard against corrupted or legacy values — progress is best-effort data.
  if (!Array.isArray(entries)) return new Map();
  return new Map(entries.map((p) => [p.cardId, p]));
}

export function saveProgress(progress: ReadonlyMap<string, CardProgress>): void {
  writeStorage(KEY, [...progress.values()]);
}
