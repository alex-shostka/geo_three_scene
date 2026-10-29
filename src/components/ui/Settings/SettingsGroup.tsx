import { useId, type ReactNode } from 'react';
import { SettingsGroupContext, useSettingsGroup } from './SettingsGroupContext';
import { SettingsSwitch } from './SettingsSwitch';

interface SettingsGroupProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}

export function SettingsGroup({ label, checked, onChange, children }: SettingsGroupProps) {
  const parent = useSettingsGroup();
  const labelId = useId();

  return (
    <li className="settings-group">
      <div className="settings-item">
        <SettingsSwitch
          label={label}
          labelId={labelId}
          checked={checked}
          disabled={parent.disabled}
          onChange={onChange}
        />
      </div>
      <ul className="settings-list settings-list--nested" aria-labelledby={labelId}>
        <SettingsGroupContext value={{ disabled: parent.disabled || !checked }}>{children}</SettingsGroupContext>
      </ul>
    </li>
  );
}
