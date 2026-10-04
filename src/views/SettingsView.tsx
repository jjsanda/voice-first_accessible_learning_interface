import { SettingsPanel } from '../components/SettingsPanel';
import type { Settings } from '../state/settings';

export interface SettingsViewProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export function SettingsView({ settings, onSettingsChange }: SettingsViewProps) {
  return (
    <div>
      <h1 tabIndex={-1} data-view-heading>
        Settings
      </h1>
      <SettingsPanel settings={settings} onSettingsChange={onSettingsChange} />
    </div>
  );
}
