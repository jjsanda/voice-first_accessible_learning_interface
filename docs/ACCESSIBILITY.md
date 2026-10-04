# Accessibility

This app is built voice-first, but its accessibility promise is broader: **every feature works by
voice, by keyboard, and by pointer, and everything the app says out loud is also announced to
screen readers.** Voice is an option, never a requirement.

The target is **WCAG 2.2 level AA**. This page documents what is implemented, how it has been
tested, and what the known limitations are. If you find a barrier, please
[open an issue](https://github.com/jjsanda/voice-first_accessible_learning_interface/issues) — accessibility reports are treated as bugs, not feature
requests.

## What is implemented

### Structure and navigation

- **Skip link** — the first focusable element is a "Skip to main content" link that jumps past
  the header navigation (`src/components/SkipLink.tsx`). It is visually hidden until focused.
- **Semantic landmarks** — one `<header>` with a labelled `<nav>`, one `<main id="main">`, one
  `<footer>`, and a labelled voice-control region. Each view has exactly one `<h1>`.
- **Focus management on view change** — every view's `<h1>` carries `data-view-heading` and
  `tabIndex={-1}`; when the route changes, focus moves to that heading (`App.tsx`), so keyboard
  and screen-reader users land at the top of the new view instead of being stranded.
- **Current location is exposed** — the active navigation link has `aria-current="page"`, and the
  lesson reader marks the current section with `aria-current`.

### Screen-reader announcements

- **Live regions** (`src/components/LiveRegion.tsx`) — status updates ("Answer ready.",
  "Marked correct.", mode changes) go to a visually hidden `aria-live="polite"` region. Errors
  (for example, blocked microphone access) render with `role="alert"`, which is implicitly
  assertive. Sighted users get the same information from the on-screen voice HUD, so nobody gets
  more or less feedback than anyone else.
- Microphone state changes are announced ("Listening." / "Microphone off.") — essential when
  the mic is toggled with the `Space` shortcut while focus is elsewhere.
- The microphone button has a stable accessible name ("Microphone") and exposes its state with
  `aria-pressed`, following the toggle-button convention.
- Announcements re-fire even when the same message repeats (the live region's content is keyed
  per announcement), so saying "stop" twice gives feedback twice.

### Keyboard operability

Everything is reachable and operable by keyboard alone. Global shortcuts (implemented in
`App.tsx`):

| Key                 | Action                                  | Where it works                                  |
| ------------------- | --------------------------------------- | ----------------------------------------------- |
| `Space`             | Push-to-talk: start/stop the microphone | Anywhere outside text fields, links and buttons |
| `Esc`               | Stop speech immediately                 | Everywhere, including inside text fields        |
| `?`                 | Open the voice-command help dialog      | Anywhere outside text fields                    |
| `Tab` / `Shift+Tab` | Move between controls                   | Everywhere                                      |
| `Enter` / `Space`   | Activate the focused control            | Every button and link                           |

The command help is a native `<dialog>` opened with `showModal()`, so focus containment and
`Esc`-to-close come from the browser. Shortcuts never steal keys from form fields: typing a
space or a question mark into the ask box behaves normally.

The `Space` push-to-talk shortcut is a single-character shortcut in the sense of WCAG 2.1.4,
so it can be **turned off in Settings** ("Use Space as a push-to-talk shortcut") for people
whose assistive technology emits stray key presses. The microphone button always works.

### Voice parity

Every voice command dispatches the same `Intent` object as its on-screen button, so there is no
voice-only feature by construction. "Flip", "next", "I got it right", "read lesson three",
"stop" — each has a visible, labelled, keyboard-operable equivalent. Questions can be typed into
a labelled text field instead of spoken. If the browser has no speech recognition at all, the app
states that plainly and remains fully usable.

### Visual design

- **Visible focus** — a global 3 px focus ring (`:focus-visible`) in a dedicated high-contrast
  color, offset from the element so it is never obscured (WCAG 2.4.11-friendly).
- **Color contrast** — the design tokens (`src/styles/tokens.css`) are built high-contrast-first:
  every foreground/background pair is chosen to meet 4.5:1 for text and 3:1 for large text and UI
  parts, in both the light and dark themes. Theme follows the system by default and can be
  overridden in Settings.
- **Target sizes** — buttons and inputs have a minimum height of 44 px.
- **Readable type** — 18 px base font size with 1.6 line height, and a content column capped at a
  comfortable measure.
- **Reduced motion** — under `prefers-reduced-motion: reduce`, all animation and smooth scrolling
  are disabled globally, and the pulsing "listening" microphone animation is replaced by a static
  double outline so the state is still visible.
- **Forced colors / Windows High Contrast** — under `forced-colors: active`, buttons, cards and
  inputs keep explicit borders drawn in system colors so control boundaries survive.

### Forms

Every input has a programmatically associated `<label>` (visible or visually hidden): the ask
box, the reading-speed slider, the theme selector, and the API-key field.

## Testing performed

Honest scope: this is what has actually been run, and what has not.

- **Automated, in CI on every push to `main` and every pull request:**
  - `eslint-plugin-jsx-a11y` (recommended ruleset) over all components.
  - React Testing Library tests that exercise real flows through the accessibility tree — for
    example, a complete flashcard review using buttons alone, a flashcard keyboard-operability
    test, the skip link, and labelled settings controls. Queries are role- and label-based, so a
    control without an accessible name fails the test.
- **Manual:** keyboard-only walkthroughs of every view during development.
- **Not yet systematically performed:** full screen-reader test passes with NVDA, JAWS or
  VoiceOver. Reports from real screen-reader users are explicitly welcomed and will be
  prioritized — if something is announced badly or not at all, please open an issue naming your
  screen reader, browser and what you heard.

## Known limitations

- **Speech recognition is browser-dependent.** The Web Speech API's recognition side is
  effectively Chromium-only (Chrome, Edge), with partial support in Safari via the
  `webkit` prefix. In Chromium browsers, recorded audio is sent to
  Google's servers for transcription — this is how the browser implements the API and is outside
  the app's control. In browsers without recognition, the microphone button is disabled with an
  explanation and everything works by keyboard and typing.
- **Speech synthesis quality varies by operating system.** The app prefers a local English voice
  but can only use what the OS provides; voice naturalness differs considerably between
  platforms.
- **The live interim transcript is intentionally not announced to screen readers**
  (`aria-hidden="true"`). It updates several times per second while you speak, which would flood
  a screen reader with noise. The _result_ of the command is always announced instead.
- **English only, for now.** Recognition is configured for `en-US` and the course format currently
  requires `language: "en"`.

## Privacy notes

- By default, nothing you say or study leaves your device. The course, the search index, and the
  offline answer engine all run in your browser; progress and settings live in `localStorage`.
- **Web Speech API:** when you use the microphone in a Chromium browser, that browser sends the
  audio to Google's speech service for transcription. Text-to-speech is local.
- **Optional Anthropic API key:** if you add your own key in Settings, it is stored only in this
  browser's `localStorage`, is never logged, and is sent nowhere except directly to the Anthropic
  API. When the AI engine answers a question, only your question and the handful of matched
  course excerpts are sent — never your progress, settings or anything else. Remove the key in
  Settings at any time to return to fully offline answers.
