export interface MicButtonProps {
  supported: boolean;
  listening: boolean;
  onToggle: () => void;
}

export function MicButton({ supported, listening, onToggle }: MicButtonProps) {
  if (!supported) {
    return (
      <button
        type="button"
        className="mic-button"
        disabled
        title="Voice input needs a browser with speech recognition, such as Chrome or Edge"
      >
        <MicIcon />
        <span className="visually-hidden">Voice input not supported in this browser</span>
      </button>
    );
  }

  // Stable name + aria-pressed carrying the state, per the toggle-button
  // convention ("Microphone, pressed" / "Microphone, not pressed").
  return (
    <button
      type="button"
      className={`mic-button${listening ? ' mic-button--listening' : ''}`}
      aria-pressed={listening}
      onClick={onToggle}
    >
      <MicIcon />
      <span className="visually-hidden">Microphone</span>
    </button>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path
        d="M5 11a7 7 0 0 0 14 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <line
        x1="12"
        y1="18"
        x2="12"
        y2="22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
