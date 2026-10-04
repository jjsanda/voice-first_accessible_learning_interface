import { useEffect, useRef } from 'react';

export interface CommandHelpProps {
  open: boolean;
  onClose: () => void;
}

const COMMAND_GROUPS: Array<{ title: string; commands: Array<[string, string]> }> = [
  {
    title: 'Anywhere',
    commands: [
      ['"Go to lessons / quiz / questions / home / settings"', 'Navigate between views'],
      ['"Ask …" followed by a question', 'Ask about the course from any view'],
      ['"Stop" or "be quiet"', 'Stop the current speech'],
      ['"Pause" / "continue"', 'Pause or resume speech'],
      ['"Help" or "what can I say"', 'Open this list'],
    ],
  },
  {
    title: 'Asking questions',
    commands: [
      ['Just speak your question', 'For example "How do hash tables handle collisions?"'],
      ['"Repeat"', 'Hear the last answer again'],
    ],
  },
  {
    title: 'Lessons',
    commands: [
      ['"Read lesson three" or "read the lesson about sorting"', 'Open a lesson and read it aloud'],
      ['"Next section" / "previous section"', 'Move through the lesson'],
      ['"Repeat"', 'Re-read the current section'],
    ],
  },
  {
    title: 'Quiz',
    commands: [
      ['"Flip" or "show the answer"', 'Reveal the back of the card'],
      ['"Right" / "I knew it"', 'Mark the card correct'],
      ['"Wrong" / "no idea"', 'Mark the card wrong'],
      ['"Next" or "skip"', 'Skip to the next card'],
      ['"Repeat"', 'Hear the card again'],
    ],
  },
];

/** Dialog listing every voice command, grouped by where it works. */
export function CommandHelp({ open, onClose }: CommandHelpProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="command-help"
      aria-labelledby="command-help-title"
      onClose={onClose}
    >
      <div className="command-help__header">
        <h2 id="command-help-title">Voice commands</h2>
        <button type="button" className="btn btn--quiet" onClick={onClose}>
          Close
        </button>
      </div>
      <p>
        Everything here also works with the keyboard and buttons — voice is an option, never a
        requirement. Press <kbd>Space</kbd> to talk, <kbd>Esc</kbd> to stop speech.
      </p>
      {COMMAND_GROUPS.map((group) => (
        <section key={group.title}>
          <h3>{group.title}</h3>
          <ul className="command-help__list">
            {group.commands.map(([phrase, effect]) => (
              <li key={phrase}>
                <strong>{phrase}</strong> — {effect}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </dialog>
  );
}
