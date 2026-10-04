import { readStorage, removeStorage, writeStorage } from '../utils/storage';

export type ThemePreference = 'auto' | 'light' | 'dark';

export interface Settings {
  /** Text-to-speech rate multiplier. */
  voiceRate: number;
  theme: ThemePreference;
  /**
   * Whether Space acts as a global push-to-talk key. Off by choice for people
   * whose assistive tech emits stray key presses (WCAG 2.1.4).
   */
  spacePushToTalk: boolean;
}

const DEFAULTS: Settings = { voiceRate: 1, theme: 'auto', spacePushToTalk: true };

const SETTINGS_KEY = 'settings';
const API_KEY_KEY = 'anthropicApiKey';

export function loadSettings(): Settings {
  return { ...DEFAULTS, ...readStorage<Partial<Settings>>(SETTINGS_KEY, {}) };
}

export function saveSettings(settings: Settings): void {
  writeStorage(SETTINGS_KEY, settings);
}

/**
 * The optional Anthropic API key is stored separately from other settings and
 * only in this browser's localStorage. It is never sent anywhere except
 * directly to the Anthropic API, and never logged.
 */
export function loadApiKey(): string | null {
  return readStorage<string | null>(API_KEY_KEY, null);
}

export function saveApiKey(key: string): void {
  writeStorage(API_KEY_KEY, key);
}

export function clearApiKey(): void {
  removeStorage(API_KEY_KEY);
}

/** Applies the theme preference to the document root (see tokens.css). */
export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement;
  if (theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = theme;
}
