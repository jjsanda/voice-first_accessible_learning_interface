# Course format

A course is a single JSON file: ordered lessons made of prose sections, plus a pool of
flashcards. The demo ships with a CS fundamentals course
(`src/course/data/cs-fundamentals.json`), but the app treats any valid course file the same way.
This guide documents the exact format, how the app uses each field, and how to write content that
works well when spoken aloud and searched by voice.

The format is defined in `src/types/course.ts` and enforced by `src/course/validate.ts`.

## Schema

### Course (top level)

| Field         | Type        | Required | Rules                                                                  |
| ------------- | ----------- | -------- | ---------------------------------------------------------------------- |
| `id`          | string      | yes      | Non-empty.                                                             |
| `title`       | string      | yes      | Non-empty. Shown in headings and spoken.                               |
| `description` | string      | yes      | Non-empty. One or two sentences about the course.                      |
| `language`    | `"en"`      | yes      | Must be exactly `"en"` (English is the only supported language today). |
| `version`     | string      | yes      | Non-empty. Your own versioning, e.g. `"1.0.0"`.                        |
| `lessons`     | Lesson[]    | yes      | Must be a non-empty array.                                             |
| `flashcards`  | Flashcard[] | yes      | Must be an array; may be empty if you don't want a quiz.               |

### Lesson

| Field      | Type      | Required | Rules                                                                                                                                                          |
| ---------- | --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`       | string    | yes      | Non-empty, **unique among lessons**. Appears in URLs (`#/lessons/<id>`), so keep it URL-friendly (`"big-o"`, `"hash-tables"`).                                 |
| `title`    | string    | yes      | Non-empty. Matched when the learner says "read the lesson about _sorting_".                                                                                    |
| `order`    | number    | yes      | Lessons are **sorted by `order`** after validation, so the order of the array itself doesn't matter. "Read lesson three" means the third lesson after sorting. |
| `summary`  | string    | yes      | Non-empty. One sentence; shown in the lesson list.                                                                                                             |
| `sections` | Section[] | yes      | Must be a non-empty array.                                                                                                                                     |

### Section

| Field     | Type   | Required | Rules                                                                                       |
| --------- | ------ | -------- | ------------------------------------------------------------------------------------------- |
| `id`      | string | yes      | Non-empty, **unique across all sections in the whole course** (not just within its lesson). |
| `title`   | string | yes      | Non-empty. Spoken when the section is read and boosted in search.                           |
| `content` | string | yes      | Non-empty. Plain prose; separate paragraphs with a blank line (`\n\n`).                     |

### Flashcard

| Field      | Type     | Required | Rules                                                                                                                  |
| ---------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `id`       | string   | yes      | Non-empty, **unique among flashcards**. Progress is stored per card id, so changing an id resets that card's schedule. |
| `lessonId` | string   | yes      | Must **match the `id` of an existing lesson** (referential integrity is enforced).                                     |
| `front`    | string   | yes      | Non-empty. The question side, spoken aloud.                                                                            |
| `back`     | string   | yes      | Non-empty. The answer side, spoken aloud on "flip".                                                                    |
| `tags`     | string[] | no       | If present, must be an array of strings. Currently metadata only.                                                      |

## Minimal complete example

```json
{
  "id": "bread-baking",
  "title": "Bread Baking Basics",
  "description": "A short course on how yeast, flour and time turn into bread.",
  "language": "en",
  "version": "1.0.0",
  "lessons": [
    {
      "id": "yeast",
      "title": "How Yeast Works",
      "order": 1,
      "summary": "This lesson explains what yeast does during fermentation and proofing.",
      "sections": [
        {
          "id": "yeast-fermentation",
          "title": "Fermentation",
          "content": "Yeast is a living organism that eats the sugars in flour and releases carbon dioxide gas. That gas gets trapped in the dough's gluten network, which is what makes bread rise.\n\nFermentation also creates flavor. A slow, cool rise gives the yeast time to produce the acids and alcohols that make bread taste like bread rather than like baked flour."
        }
      ]
    }
  ],
  "flashcards": [
    {
      "id": "fc-yeast-rise",
      "lessonId": "yeast",
      "front": "Why does bread dough rise?",
      "back": "Yeast eats sugars in the flour and releases carbon dioxide, and the gas gets trapped in the dough's gluten network, inflating it.",
      "tags": ["yeast"]
    }
  ]
}
```

## How the app uses your content

Knowing what happens to each field makes it easier to write good material:

- **Sections become search chunks.** Every question the learner asks is answered by a keyword
  (BM25) search over section content. Sections longer than **1200 characters are split at
  paragraph boundaries** into multiple chunks, with a one-sentence overlap so ideas spanning a
  break stay findable. The lesson title and section title are added to each chunk's search text
  with extra weight, so a question phrased like your title finds the right section.
- **Answers quote your sentences.** The offline answer engine picks up to three sentences
  that best match the question and reads them aloud verbatim, citing lesson and section. Every
  sentence must therefore make sense out of context and sound right when spoken.
- **Lessons are read aloud** section by section, announced as "_Lesson title_. Section 2 of 4:
  _Section title_." followed by the content, auto-advancing to the end.
- **Flashcards go through Leitner spaced repetition.** Each card sits in a box from 0 to 4; a
  correct answer moves it up one box (reviewed after 8 hours, 1 day, 3 days, then weekly), a
  wrong answer sends it back to box 0 (due immediately). Review sessions take up to 20 cards:
  due cards first, shakiest first, then unseen cards in course order.

## Authoring tips

**Write for the ear first.** Everything can be spoken by text-to-speech, so content must be plain
prose: no markdown, no symbols, no bullet lists, no tables, no code blocks. If you can't read a
sentence aloud naturally, rewrite it.

**Express notation in words too.** Text-to-speech reads "O(log n)" unpredictably, and learners
ask questions in words, not symbols. Pair every piece of notation with its spoken form:
"O(log n), meaning the work grows logarithmically" or "n squared" alongside "n²". The demo
course does this throughout.

**Keep sections to 1–3 paragraphs.** That is one comfortable listening unit, and it stays under
the 1200-character search-chunk limit so the whole section is scored as one coherent piece.
Longer sections still work — they are split automatically — but tightly focused sections retrieve
better.

**Be synonym-rich.** Search is keyword-based, not semantic, so a paraphrased question only
matches if your prose contains its words. Name concepts multiple ways in running text: "a
resizable array, also called a dynamic array, an array list, or a vector". Think about how a
learner would _ask_ about the topic and make sure those words appear.

**Give each section a question-shaped title.** Titles are boosted in search, so "What Big-O
Notation Means" or "Trade-offs Between Arrays and Linked Lists" catches the questions people
actually ask.

**Flashcard fronts are spoken questions.** Write the front as a natural question someone could
answer out loud ("Why does bread dough rise?"), not a cloze or a keyword. Keep the back to one
or two sentences — it is read aloud in full, and a learner should be able to judge "right" or
"wrong" against it quickly.

## Using a custom course

The current integration point is the bundled file: **edit or replace
`src/course/data/cs-fundamentals.json`** and run the app (`npm run dev`). No other change is
needed — the UI, search, reading and quiz all derive from the course data.

Under the hood, `loadCourse(source)` in `src/course/loader.ts` validates _any_ course object
passed to it, not just the bundled one, so loading a course from a URL or a file picker is a
natural extension — the validation and everything downstream already work on arbitrary courses.

### Validation

The course is validated on startup. Validation is strict but helpful: error messages are
**path-precise and reported all at once**, so you can fix every problem in a single pass rather
than replaying whack-a-mole. For example:

```
Invalid course:
  - lessons[2].summary must be a non-empty string
  - lessons[2].sections[0].id "yeast-fermentation" is duplicated
  - flashcards[4].lessonId "yeasts" does not match any lesson
```

If validation fails, the app shows this list on a "Course failed to load" screen instead of
starting with broken data.
