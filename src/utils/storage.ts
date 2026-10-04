/**
 * Namespaced, JSON-safe localStorage helpers. All keys used by the app are
 * prefixed "vfal." (voice-first accessible learning) to avoid collisions.
 * Storage failures (private browsing, quota) degrade to in-memory defaults.
 */

const PREFIX = 'vfal.';

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota exceeded) — state stays in memory.
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // Ignore — nothing to remove if storage is unavailable.
  }
}
