import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { loadApiKey } from '../../state/settings';
import { SettingsPanel } from '../SettingsPanel';

const defaultSettings = { voiceRate: 1, theme: 'auto' as const, spacePushToTalk: true };

describe('SettingsPanel', () => {
  it('saves the API key to browser storage only', async () => {
    render(<SettingsPanel settings={defaultSettings} onSettingsChange={vi.fn()} />);
    const input = screen.getByLabelText(/anthropic api key/i);
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.type(input, 'sk-ant-test-key');
    await userEvent.click(screen.getByRole('button', { name: /save key/i }));
    expect(loadApiKey()).toBe('sk-ant-test-key');
    expect(screen.getByText(/api key configured/i)).toBeInTheDocument();
  });

  it('removes a stored API key', async () => {
    window.localStorage.setItem('vfal.anthropicApiKey', JSON.stringify('sk-ant-old'));
    render(<SettingsPanel settings={defaultSettings} onSettingsChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /remove key/i }));
    expect(loadApiKey()).toBeNull();
  });

  it('updates the voice rate through a labelled slider', () => {
    const onChange = vi.fn();
    render(<SettingsPanel settings={defaultSettings} onSettingsChange={onChange} />);
    const slider = screen.getByLabelText(/reading speed/i);
    fireEvent.change(slider, { target: { value: '1.2' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ voiceRate: 1.2 }));
  });

  it('changes the theme preference', async () => {
    const onChange = vi.fn();
    render(<SettingsPanel settings={defaultSettings} onSettingsChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Theme'), 'dark');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
