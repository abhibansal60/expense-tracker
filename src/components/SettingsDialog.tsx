import type { ChangeEvent } from 'react';
import type { ExpenseTrackerPreferences } from './ExpenseTracker';
import { X } from 'lucide-react';

interface SettingsDialogProps {
  isOpen: boolean;
  preferences: ExpenseTrackerPreferences;
  onUpdatePreferences: (patch: Partial<ExpenseTrackerPreferences>) => void;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, preferences, onUpdatePreferences, onClose }: SettingsDialogProps) {
  if (!isOpen) return null;

  const handleCompactToggle = (event: ChangeEvent<HTMLInputElement>) => {
    onUpdatePreferences({ compactMode: event.target.checked });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="settings-panel w-full max-w-lg card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="eyebrow">Workspace settings</p>
            <h3 className="panel-title">Customize your tracker</h3>
            <p className="panel-subtitle">Personalize how lists look and behave on this device.</p>
          </div>
          <button className="btn-soft" onClick={onClose} aria-label="Close settings">
            <X className="h-4 w-4" />
            Close
          </button>
        </div>

        <div className="settings-section">
          <h4>Appearance</h4>
          <div className="setting-row">
            <div>
              <p className="font-medium text-gray-900">Compact expense list</p>
              <p className="text-sm text-gray-500">Tighten spacing so you can see more lines at once.</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={preferences.compactMode} onChange={handleCompactToggle} />
              <span className="slider" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
