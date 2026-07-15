interface SettingsToggleItemProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  child?: boolean;
}

export function SettingsToggleItem({ label, checked, disabled, onChange, child }: SettingsToggleItemProps) {
  return (
    <li className={child ? 'settings-item settings-item--child' : 'settings-item'}>
      <label className="settings-label">
        <span className="settings-text">{label}</span>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="settings-toggle"></span>
      </label>
    </li>
  );
}
