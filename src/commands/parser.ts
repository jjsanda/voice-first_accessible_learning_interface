import type { CommandContext, ParsedCommand } from '../types/commands';
import { GRAMMAR } from './grammar';
import { normalize } from './normalize';

/**
 * Turns a raw transcript into an Intent. Grammar patterns are tried in order
 * (global first, then the current mode's). In ask mode, anything that isn't a
 * command is treated as the question itself — that is what makes "What is a
 * hash table?" work without a magic prefix. Everywhere else, unmatched input
 * becomes UNRECOGNIZED so the UI can offer help instead of guessing.
 */
export function parseCommand(rawTranscript: string, context: CommandContext): ParsedCommand {
  const transcript = rawTranscript.trim();
  const normalized = normalize(transcript);
  if (!normalized) {
    return { intent: { type: 'UNRECOGNIZED', transcript } };
  }

  for (const entry of GRAMMAR) {
    if (entry.modes !== 'global' && !entry.modes.includes(context.mode)) continue;
    for (const pattern of entry.patterns) {
      const match = normalized.match(pattern);
      if (match) {
        return { intent: entry.make(match), matchedPhrase: match[0] };
      }
    }
  }

  if (context.mode === 'ask') {
    return { intent: { type: 'ASK_QUESTION', question: transcript } };
  }
  return { intent: { type: 'UNRECOGNIZED', transcript } };
}
