# Architecture

The app is a client-side-only React + TypeScript + Vite application. There is no server: the
course ships as JSON inside the bundle, search runs in the browser, progress lives in
`localStorage`, and speech uses the browser's Web Speech API. The production build is a static
site deployed to GitHub Pages.

## Dependency direction

Code is layered so that everything interesting is testable without a browser or React:

```
┌────────────────────────────────────────────────────────────┐
│  React UI                                                  │
│  App.tsx · views/ · components/ · state/appStore.tsx       │
│  hooks: useCommandRouter, useHashRoute,                    │
│         useSpeechRecognition, useSpeechSynthesis           │
├────────────────────────────────────────────────────────────┤
│  Browser adapters (DOM/Web APIs, no React)                 │
│  speech/recognition.ts · speech/synthesis.ts               │
│  utils/storage.ts · srs/progressStore.ts                   │
├────────────────────────────────────────────────────────────┤
│  Pure TypeScript domain core (no React, no DOM)            │
│  types/ · course/ · retrieval/ · answer/ · srs/scheduler   │
│  commands/{normalize,grammar,parser} · utils/sentences     │
└────────────────────────────────────────────────────────────┘
```

Imports only point downward. The domain core never imports React; the React layer is thin glue
that wires user input to the core and renders its output.

## Modules

| Module                          | Responsibility                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/`                    | Shared contracts: `Course`/`Lesson`/`Section`/`Flashcard` (`course.ts`), `Answer`/`AnswerEngine`/`Citation`/`SearchResult` (`answer.ts`), `Intent`/`AppMode`/`ParsedCommand` (`commands.ts`).                                                                                                                                                                                                                                       |
| `src/course/`                   | `loader.ts` loads and caches the bundled course; `validate.ts` structurally validates any course object with path-precise error messages and sorts lessons by `order`. See [COURSE_FORMAT.md](COURSE_FORMAT.md).                                                                                                                                                                                                                    |
| `src/retrieval/`                | Keyword search. `tokenize.ts`: lowercase, strip punctuation, drop stopwords, light suffix stemming. `chunker.ts`: turns sections into search chunks, splitting sections over 1200 characters at paragraph boundaries with a one-sentence overlap. `bm25.ts`: classic BM25 index (`k1 = 1.5`, `b = 0.75`); lesson and section titles are prepended to the _indexed_ text so questions phrased like a title rank that section highly. |
| `src/answer/`                   | Turns retrieval results into an `Answer`. `ExtractiveEngine.ts` quotes the best-matching sentences with citations, entirely offline. `AnthropicEngine.ts` (optional) asks Claude to compose an answer from the same excerpts. `engineFactory.ts` picks the engine and handles fallback.                                                                                                                                             |
| `src/commands/`                 | Voice command understanding. `normalize.ts` cleans a transcript (lowercase, punctuation, politeness prefixes, "three" → "3"). `grammar.ts` is a declarative table of regex patterns → `Intent`, global commands first, then mode-specific ones. `parser.ts` runs the table. `useCommandRouter.ts` (React) is the single place intents become actions.                                                                               |
| `src/speech/`                   | Web Speech API wrappers (`recognition.ts`, `synthesis.ts`, `support.ts`) plus React hook bindings. Details below.                                                                                                                                                                                                                                                                                                                   |
| `src/srs/`                      | `scheduler.ts`: pure Leitner spaced-repetition functions (boxes 0–4, intervals 0 h / 8 h / 24 h / 72 h / 168 h; correct promotes one box, wrong resets to box 0; the review queue takes due cards lowest-box-first, then unseen cards, capped at 20). `progressStore.ts` persists progress to `localStorage`.                                                                                                                       |
| `src/state/`                    | `appStore.tsx`: reducer + context holding quiz session, ask history, lesson section index and screen-reader announcements; also builds the search index once per course. `useHashRoute.ts`: tiny hash router. `settings.ts`: voice rate, theme and the optional Anthropic API key (stored under a separate `localStorage` key).                                                                                                     |
| `src/utils/`                    | `sentences.ts`: sentence splitting shared by the extractive engine and the TTS queue. `storage.ts`: namespaced (`vfal.`), failure-tolerant `localStorage` helpers.                                                                                                                                                                                                                                                                  |
| `src/components/`, `src/views/` | Presentational React. `App.tsx` is the shell: global keyboard shortcuts, focus management on view change, the voice HUD, the command-help dialog and the live regions.                                                                                                                                                                                                                                                              |

## How a voice command flows

```
 mic press (button, or Space anywhere outside a text field)
   │
   ▼
 SpeechRecognizer (speech/recognition.ts)          browser STT session
   │  onFinal(transcript)
   ▼
 parseCommand(transcript, { mode })                commands/parser.ts
   │  normalize → match grammar table → Intent
   ▼
 useCommandRouter.execute(intent)                  commands/useCommandRouter.ts
   │
   ├── navigate(route)          → state/useHashRoute (updates location.hash)
   ├── store.dispatch(action)   → state/appStore (quiz, lesson, announcements)
   └── say(text)                → ANNOUNCE (live region) + Speaker (TTS)
```

Two properties matter here:

- **Buttons dispatch the same `Intent`s as voice.** The "Flip" button and saying "flip" both call
  `execute({ type: 'FLIP' })`, so there is exactly one code path per action and voice parity is
  structural, not duplicated.
- **Every action announces itself twice**: visually/audibly through TTS and via the `ANNOUNCE`
  action, which renders into an `aria-live` region for screen-reader users.

In _ask_ mode, anything that doesn't match a command is treated as the question itself — that is
why "How do hash tables handle collisions?" works without a magic prefix. In other modes,
unmatched input becomes `UNRECOGNIZED` and the app offers help instead of guessing.

## How a question flows

```
 question (spoken or typed)
   │
   ▼
 searchIndex.search(question, 6)        BM25 over course chunks (retrieval/)
   │  SearchResult[] (chunk + score)
   ▼
 answerQuestion(course, q, results)     answer/engineFactory.ts
   │
   ├── API key configured?  ──yes──►  AnthropicEngine (12 s timeout)
   │                                     │ failure of any kind
   │                                     ▼
   └────────────no────────────────►  ExtractiveEngine (offline)
   │
   ▼
 Answer { text, spokenText, citations, engine, grounded }
   │
   ▼
 store (ask history) → AnswerCard on screen + spokenText via TTS
```

`ExtractiveEngine` refuses to bluff: if the best BM25 score is below a relevance threshold it
returns a `grounded: false` answer that says the course doesn't cover the topic and suggests
lesson titles instead. `AnthropicEngine` is instructed to answer _only_ from the excerpts and to
cite them with `[S1]`-style markers, which are resolved back into the same `Citation` shape the
extractive engine produces — the UI cannot tell the engines apart. If the Anthropic call fails
(bad key, rate limit, network, timeout), `answerQuestion` falls back to the extractive answer
with a one-line `notice`, so asking always produces something useful.

Citations link into the lesson reader (`#/lessons/<lessonId>/<sectionIndex>`), so every answer is
one keypress away from its source.

## Design decisions

### Hash routing

Routes are `#/ask`, `#/lessons/<id>/<section>`, `#/quiz`, `#/settings` (`state/useHashRoute.ts`).
The app is a static site on GitHub Pages, where real sub-paths like `/quiz` would 404 on refresh
or deep link. Hash routing sidesteps that with zero server configuration and zero dependencies —
five routes do not justify a router library. Navigation is plain `<a href>` elements, which keeps
links working for screen readers, middle-click and the browser history for free.

### Push-to-talk, not continuous listening

`SpeechRecognizer` runs one non-continuous recognition session at a time: the user presses the
mic (or Space), speaks one phrase, and the browser ends the session. Continuous listening was
rejected because it causes restart loops when sessions silently die, picks up the app's own
text-to-speech as input (feedback loops), drains battery, and keeps the microphone hot — a
privacy problem. As extra protection, the shell stops any ongoing speech before the mic opens,
so the recognizer never hears the app talk (`toggleMic` in `App.tsx`).

### Speech-synthesis quirk workarounds

`Speaker` (`speech/synthesis.ts`) exists because raw `speechSynthesis` is unreliable:

- Chromium cuts off long utterances, so text is split into ~200-character sentence-sized pieces
  (`utils/sentences.ts`) and spoken as a queue.
- Utterances that get garbage-collected go silent mid-speech, so the queue holds strong
  references until each utterance ends.
- `getVoices()` may be empty until `voiceschanged` fires, so a voice (local English preferred) is
  re-picked for every utterance rather than cached once.

`onDone` callbacks fire when the _logical_ text finishes, which is what lets lesson reading
auto-advance section by section.

### The Anthropic SDK stays out of the main bundle

`engineFactory.ts` loads the engine with a dynamic import:

```ts
const { AnthropicEngine } = await import('./AnthropicEngine');
```

Vite code-splits this into its own chunk, so users who never configure an API key never download
the `@anthropic-ai/sdk` code. The SDK is the app's only runtime dependency besides React, and it
is only fetched at the moment a keyed user asks their first question.

### State is deliberately boring

One reducer (`appStore.tsx`) holds transient UI state; `localStorage` (namespaced `vfal.`) holds
the durable bits: settings, spaced-repetition progress and the optional API key. Storage access
is wrapped so private-browsing or quota failures degrade to in-memory defaults instead of
crashing. The search index is built once per course with `useMemo` and shared through context.
