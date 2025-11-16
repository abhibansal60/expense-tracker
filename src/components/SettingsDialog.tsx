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
    <div className="sheet-overlay" role="dialog" aria-modal="true">
      <div className="settings-sheet">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <p className="eyebrow">Workspace settings</p>
            <h3 className="panel-title">Customize your tracker</h3>
            <p className="panel-subtitle">Personalize how lists look and behave on this device.</p>
          </div>
          <button className="btn-secondary" onClick={onClose} aria-label="Close settings">
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
