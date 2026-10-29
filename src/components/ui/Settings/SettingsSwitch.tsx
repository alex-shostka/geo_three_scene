interface SettingsSwitchProps {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  labelId?: string;
}

export function SettingsSwitch({ label, checked, disabled, onChange, labelId }: SettingsSwitchProps) {
  return (
    <label className="settings-label">
      <span id={labelId} className="settings-text">
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="settings-toggle"></span>
    </label>
  );
}
