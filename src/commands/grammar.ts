import type { AppMode, Intent } from '../types/commands';

/**
 * The voice command grammar, as a declarative table evaluated in order:
 * global commands first (they work everywhere), then mode-specific ones.
 * Patterns run against the normalized transcript (see normalize.ts).
 */
export interface IntentPattern {
  modes: AppMode[] | 'global';
  patterns: RegExp[];
  make: (match: RegExpMatchArray) => Intent;
}

const NAV_TARGETS: Record<string, AppMode> = {
  home: 'home',
  start: 'home',
  ask: 'ask',
  question: 'ask',
  questions: 'ask',
  lesson: 'lessons',
  lessons: 'lessons',
  quiz: 'quiz',
  flashcard: 'quiz',
  flashcards: 'quiz',
  card: 'quiz',
  cards: 'quiz',
  review: 'quiz',
  setting: 'settings',
  settings: 'settings',
};

const NAV_TARGET_PATTERN = Object.keys(NAV_TARGETS).join('|');

export const GRAMMAR: IntentPattern[] = [
  // ----- Global: speech control -----
  {
    modes: 'global',
    patterns: [/^(stop|stop (speaking|talking|reading)|be quiet|quiet|silence)$/],
    make: () => ({ type: 'STOP_SPEAKING' }),
  },
  {
    modes: 'global',
    patterns: [/^pause$/],
    make: () => ({ type: 'PAUSE' }),
  },
  {
    modes: 'global',
    patterns: [/^(resume|continue|keep going|go on|keep reading)$/],
    make: () => ({ type: 'RESUME' }),
  },
  {
    modes: 'global',
    patterns: [/^(help|what can i say|show commands|commands|list commands)$/],
    make: () => ({ type: 'HELP' }),
  },

  // ----- Global: navigation -----
  {
    modes: 'global',
    patterns: [
      new RegExp(
        `^(?:go to|go|open|switch to|take me to|show|show me|navigate to) (?:the )?(${NAV_TARGET_PATTERN})(?: (?:page|view|mode|screen))?$`,
      ),
    ],
    make: (match) => ({ type: 'GO_TO', target: NAV_TARGETS[match[1]!]! }),
  },

  // ----- Global: explicit question prefix ("ask what is a hash table") -----
  {
    modes: 'global',
    patterns: [/^(?:ask|ask about|question) (.{3,})$/],
    make: (match) => ({ type: 'ASK_QUESTION', question: match[1]! }),
  },

  // ----- Quiz mode -----
  {
    modes: ['quiz'],
    patterns: [/^(next|next card|skip|skip card|skip this card)$/],
    make: () => ({ type: 'NEXT' }),
  },
  {
    modes: ['quiz'],
    patterns: [
      /^(flip|flip it|flip the card|turn it over|turn over|reveal|show answer|show me the answer|show the answer|answer)$/,
    ],
    make: () => ({ type: 'FLIP' }),
  },
  {
    modes: ['quiz'],
    patterns: [
      /^(right|correct|i was right|i got it right|i got it|got it|i knew it|i knew that|knew it)$/,
    ],
    make: () => ({ type: 'MARK_RIGHT' }),
  },
  {
    modes: ['quiz'],
    patterns: [
      /^(wrong|incorrect|i was wrong|i got it wrong|i missed it|i missed that|i forgot|i forgot it|i forgot that|no idea|i didnt know|i didnt know it|i didnt know that|i did not know)$/,
    ],
    make: () => ({ type: 'MARK_WRONG' }),
  },

  // ----- Lessons mode -----
  {
    modes: ['lessons', 'home'],
    patterns: [
      /^(?:read|open|start|play)(?: me)? lesson (?:number )?(\d+)$/,
      /^(?:read|open|start|play)(?: me)?(?: the)? lesson (?:about |on )?(.{3,})$/,
    ],
    make: (match) => ({ type: 'READ_LESSON', lessonRef: match[1] }),
  },
  {
    modes: ['lessons'],
    patterns: [/^(read|read this|read it|read aloud|read this lesson|read the lesson)$/],
    make: () => ({ type: 'READ_LESSON' }),
  },
  {
    modes: ['lessons'],
    patterns: [/^(next|next section|skip|skip section|skip this section)$/],
    make: () => ({ type: 'NEXT' }),
  },
  {
    modes: ['lessons'],
    patterns: [/^(previous|previous section|go back|back|last section)$/],
    make: () => ({ type: 'PREVIOUS' }),
  },

  // ----- Repeat (quiz, lessons and ask all have something to repeat) -----
  {
    modes: ['quiz', 'lessons', 'ask'],
    patterns: [/^(repeat|repeat that|say that again|say it again|read that again|again)$/],
    make: () => ({ type: 'REPEAT' }),
  },
];
