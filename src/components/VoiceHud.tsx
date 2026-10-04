import { MicButton } from './MicButton';

export type HudStatus = 'unsupported' | 'idle' | 'listening' | 'thinking' | 'speaking';

export interface VoiceHudProps {
  status: HudStatus;
  sttSupported: boolean;
  interimTranscript: string;
  lastCommand: string | null;
  onMicToggle: () => void;
  onStopSpeaking: () => void;
  onOpenHelp: () => void;
}

const STATUS_LABELS: Record<HudStatus, string> = {
  unsupported: 'Voice input unavailable — use the keyboard or buttons',
  idle: 'Press the microphone or Space to speak',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
};

/**
 * The persistent voice control bar at the bottom of every view: microphone,
 * live transcript, current speech state, and quick access to command help.
 */
export function VoiceHud({
  status,
  sttSupported,
  interimTranscript,
  lastCommand,
  onMicToggle,
  onStopSpeaking,
  onOpenHelp,
}: VoiceHudProps) {
  return (
    <section className="voice-hud" aria-label="Voice controls">
      <div className="container voice-hud__inner">
        <MicButton
          supported={sttSupported}
          listening={status === 'listening'}
          onToggle={onMicToggle}
        />
        <div className="voice-hud__status">
          <p className={`voice-hud__state voice-hud__state--${status}`}>{STATUS_LABELS[status]}</p>
          {interimTranscript ? (
            <p className="voice-hud__transcript" aria-hidden="true">
              {interimTranscript}
            </p>
          ) : lastCommand ? (
            <p className="voice-hud__command">
              Heard: <span className="voice-hud__chip">{lastCommand}</span>
            </p>
          ) : null}
        </div>
        <div className="voice-hud__actions">
          {status === 'speaking' && (
            <button type="button" className="btn btn--quiet" onClick={onStopSpeaking}>
              Stop
            </button>
          )}
          <button
            type="button"
            className="btn btn--quiet"
            onClick={onOpenHelp}
            aria-haspopup="dialog"
          >
            Commands
          </button>
        </div>
      </div>
    </section>
  );
}
