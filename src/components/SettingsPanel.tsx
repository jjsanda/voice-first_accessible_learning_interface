import { useState } from 'react';
import {
  applyTheme,
  clearApiKey,
  loadApiKey,
  saveApiKey,
  saveSettings,
  type Settings,
  type ThemePreference,
} from '../state/settings';

export interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const [keyInput, setKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(() => loadApiKey() !== null);
  const [keyStatus, setKeyStatus] = useState<string | null>(null);

  const update = (next: Settings) => {
    saveSettings(next);
    onSettingsChange(next);
  };

  return (
    <div className="settings">
      <section className="card">
        <h2>Speech</h2>
        <label htmlFor="voice-rate">Reading speed: {settings.voiceRate.toFixed(1)}×</label>
        <input
          id="voice-rate"
          type="range"
          min="0.8"
          max="1.5"
          step="0.1"
          value={settings.voiceRate}
          onChange={(e) => update({ ...settings, voiceRate: Number(e.target.value) })}
        />
        <div className="settings__toggle-row">
          <input
            id="space-ptt"
            type="checkbox"
            checked={settings.spacePushToTalk}
            onChange={(e) => update({ ...settings, spacePushToTalk: e.target.checked })}
          />
          <label htmlFor="space-ptt">
            Use <kbd>Space</kbd> as a push-to-talk shortcut
          </label>
        </div>
        <p className="settings__note">
          Turn this off if your assistive technology sends stray key presses. The microphone button
          always works.
        </p>
      </section>

      <section className="card">
        <h2>Appearance</h2>
        <label htmlFor="theme-select">Theme</label>
        <select
          id="theme-select"
          value={settings.theme}
          onChange={(e) => {
            const theme = e.target.value as ThemePreference;
            applyTheme(theme);
            update({ ...settings, theme });
          }}
        >
          <option value="auto">Match system</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </section>

      <section className="card">
        <h2>AI answers (optional)</h2>
        <p>
          By default, answers are exact quotes from the course, generated entirely on your device.
          Add an Anthropic API key to get conversational answers composed by Claude — still grounded
          in the course content.
        </p>
        <p className="settings__note">
          The key is stored only in this browser and sent only to Anthropic, directly from your
          browser. It is never logged or shared. Consider using a key with a low spending limit.
        </p>
        {hasKey ? (
          <div className="settings__key-row">
            <p className="settings__key-set">✓ API key configured</p>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => {
                clearApiKey();
                setHasKey(false);
                setKeyStatus('API key removed.');
              }}
            >
              Remove key
            </button>
          </div>
        ) : (
          <form
            className="settings__key-row"
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = keyInput.trim();
              if (!trimmed) return;
              saveApiKey(trimmed);
              setKeyInput('');
              setHasKey(true);
              setKeyStatus('API key saved in this browser.');
            }}
          >
            <label htmlFor="api-key" className="visually-hidden">
              Anthropic API key
            </label>
            <input
              id="api-key"
              type="password"
              autoComplete="off"
              placeholder="sk-ant-…"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <button type="submit" className="btn btn--primary" disabled={!keyInput.trim()}>
              Save key
            </button>
          </form>
        )}
        {keyStatus && (
          <p role="status" className="settings__note">
            {keyStatus}
          </p>
        )}
      </section>
    </div>
  );
}
