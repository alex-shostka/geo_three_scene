import { useSettingsGroup } from './SettingsGroupContext';
import { SettingsSwitch } from './SettingsSwitch';

interface SettingsToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SettingsToggle({ label, checked, onChange }: SettingsToggleProps) {
  const group = useSettingsGroup();

  return (
    <li className="settings-item">
      <SettingsSwitch label={label} checked={checked} disabled={group.disabled} onChange={onChange} />
    </li>
  );
}
