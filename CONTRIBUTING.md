# Contributing

Thanks for your interest in improving this project! Contributions of all kinds are welcome:
bug reports, accessibility feedback, course content, and code.

## Development setup

Prerequisites: Node.js 22+ and npm.

```bash
git clone https://github.com/jjsanda/voice-first_accessible_learning_interface.git
cd voice-first_accessible_learning_interface
npm install
npm run dev
```

## Useful scripts

| Command                 | What it does                             |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start the dev server                     |
| `npm test`              | Run the unit test suite once             |
| `npm run test:watch`    | Run tests in watch mode                  |
| `npm run test:coverage` | Run tests with a coverage report         |
| `npm run lint`          | Lint (includes accessibility lint rules) |
| `npm run typecheck`     | TypeScript type checking                 |
| `npm run format`        | Format the codebase with Prettier        |
| `npm run build`         | Typecheck and produce a production build |

CI runs lint, format check, typecheck, tests and build on every push to `main` and every
pull request —
please make sure they all pass locally before opening a PR.

## Project conventions

- The domain core (`src/retrieval`, `src/srs`, `src/course`, and the non-hook parts of
  `src/commands` and `src/answer`) is pure TypeScript with no React imports — keep it that
  way so it stays easy to test.
- New logic should come with unit tests. Bug fixes should include a regression test.
- Runtime dependencies are kept deliberately minimal; please discuss before adding one.

## Accessibility expectations

Accessibility is a core feature, not an afterthought. For any UI change:

- Everything must be operable by keyboard alone, with a visible focus indicator.
- Every voice-only interaction must have an equivalent button or shortcut.
- State changes that matter to the user must be announced (see `LiveRegion`).
- Respect `prefers-reduced-motion` and maintain WCAG 2.2 AA contrast.

If you test with a screen reader (NVDA, VoiceOver, JAWS, Orca), please mention
which one in your PR — real-world reports are extremely valuable.

## Contributing a course

Courses are plain JSON — see [docs/COURSE_FORMAT.md](docs/COURSE_FORMAT.md) for the schema
and authoring tips (including how to write content that sounds good when spoken aloud).

## Reporting issues

Open a GitHub issue with steps to reproduce, your browser and OS, and — for voice
issues — whether the problem is with recognition (input) or speech (output).
