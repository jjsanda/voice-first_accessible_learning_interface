# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-16

### Added

- Voice question answering grounded in course content, with source citations
  (client-side BM25 retrieval + extractive answers, no server required).
- Optional AI-composed answers via a user-supplied Anthropic API key, with
  automatic fallback to extractive answers.
- Voice-navigated flashcard review with Leitner-style spaced repetition.
- Lesson reader with read-aloud, pause/resume and section navigation by voice.
- Full keyboard and screen-reader support: every voice feature has a non-voice
  equivalent, live-region announcements, visible focus, reduced-motion support.
- Bundled demo course: CS Fundamentals (algorithms & data structures).
- Documented JSON course format for bringing your own study material.

[0.1.0]: https://github.com/jjsanda/voice-first_accessible_learning_interface/releases/tag/v0.1.0
