export type AppMode = 'home' | 'ask' | 'lessons' | 'quiz' | 'settings';

/**
 * Everything the app can be asked to do, by voice or by UI controls.
 * Voice input parses into an Intent; buttons dispatch the same Intents,
 * so both input methods share one code path.
 */
export type Intent =
  | { type: 'GO_TO'; target: AppMode }
  | { type: 'ASK_QUESTION'; question: string }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'REPEAT' }
  | { type: 'FLIP' }
  | { type: 'MARK_RIGHT' }
  | { type: 'MARK_WRONG' }
  | { type: 'READ_LESSON'; lessonRef?: string }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STOP_SPEAKING' }
  | { type: 'HELP' }
  | { type: 'UNRECOGNIZED'; transcript: string };

export interface ParsedCommand {
  intent: Intent;
  /** The phrase that matched, for HUD display (e.g. "next card"). */
  matchedPhrase?: string;
}

/** Context the parser needs to resolve mode-specific commands. */
export interface CommandContext {
  mode: AppMode;
}
