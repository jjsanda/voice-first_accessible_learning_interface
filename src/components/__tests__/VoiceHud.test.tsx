import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VoiceHud, type VoiceHudProps } from '../VoiceHud';

function renderHud(overrides: Partial<VoiceHudProps> = {}) {
  const props: VoiceHudProps = {
    status: 'idle',
    sttSupported: true,
    interimTranscript: '',
    lastCommand: null,
    onMicToggle: vi.fn(),
    onStopSpeaking: vi.fn(),
    onOpenHelp: vi.fn(),
    ...overrides,
  };
  render(<VoiceHud {...props} />);
  return props;
}

describe('VoiceHud', () => {
  it('invites the user to speak when idle', () => {
    renderHud();
    expect(screen.getByText(/press the microphone or space/i)).toBeInTheDocument();
  });

  it('shows the listening state and live transcript', () => {
    renderHud({ status: 'listening', interimTranscript: 'next ca' });
    expect(screen.getByText('Listening…')).toBeInTheDocument();
    expect(screen.getByText('next ca')).toBeInTheDocument();
  });

  it('offers a Stop button while speaking', async () => {
    const props = renderHud({ status: 'speaking' });
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(props.onStopSpeaking).toHaveBeenCalled();
  });

  it('shows the last recognized command as a chip', () => {
    renderHud({ lastCommand: 'next card' });
    expect(screen.getByText('next card')).toBeInTheDocument();
  });

  it('explains itself when speech recognition is unsupported', () => {
    renderHud({ status: 'unsupported', sttSupported: false });
    expect(screen.getByText(/voice input unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /not supported in this browser/i })).toBeDisabled();
  });

  it('toggles the microphone from the mic button, exposing state via aria-pressed', async () => {
    const props = renderHud();
    const mic = screen.getByRole('button', { name: 'Microphone' });
    expect(mic).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(mic);
    expect(props.onMicToggle).toHaveBeenCalled();
  });
});
