# Media assets

This folder holds the screenshots and GIFs referenced by the main [README](../../README.md).
They are not recorded yet — this file describes exactly what to capture so the assets stay
consistent if they are ever re-recorded.

## What to record

| File                     | Content                                                                                                                                                                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hero.gif`               | The voice Q&A flow, end to end: press the microphone button, ask **"How do hash tables handle collisions?"** (the interim transcript appears in the HUD), the answer card appears with citations, and the "Speaking…" state shows while it is read aloud. Aim for 10–15 seconds. |
| `screenshot-ask.png`     | The Ask view with one answered question visible: question, answer text, engine badge and the citation links.                                                                                                                                                                     |
| `screenshot-quiz.png`    | The Quiz view mid-session with a card revealed, showing the Question/Answer sides and the "✓ I got it right / ✗ I got it wrong" grading buttons.                                                                                                                                 |
| `screenshot-lessons.png` | The Lessons view — either the lesson list with its "Read aloud" buttons, or the reader open on a section with the section navigation visible.                                                                                                                                    |

## How to record

- **Tools:** [Kap](https://getkap.co/) (macOS), [Peek](https://github.com/phw/peek) (Linux) or
  [ScreenToGif](https://www.screentogif.com/) (Windows) all export directly to GIF.
- **Size:** capture at roughly **1200 px wide** (a ~1200×800 browser window works well). Trim
  the browser chrome — record the page, not the whole desktop.
- **Weight:** keep GIFs **under ~10 MB** so the README loads fast; reduce the frame rate or
  duration before reducing dimensions.
- **Theme:** record in the **light theme** (Settings → Theme → Light) for consistency with the
  README badges. A dark-theme variant is welcome as an extra, not a replacement.
- **Focus states:** where a keyboard interaction is shown, make the focus ring visible — e.g. tab
  to a button before activating it in `screenshot-quiz.png`. The visible focus ring is a feature,
  not an artifact; do not crop or retouch it away.
- **Content:** use the bundled CS fundamentals course so text in the captures matches what
  visitors see on the live demo. Avoid capturing the Settings view with an API key entered.

After adding a file here, reference it from the README with a meaningful `alt` text describing
what the capture shows — the README's images must meet the same accessibility bar as the app.
