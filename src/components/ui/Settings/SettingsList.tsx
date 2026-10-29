import type { ReactNode } from 'react';

interface SettingsListProps {
  children: ReactNode;
}

export function SettingsList({ children }: SettingsListProps) {
  return <ul className="settings-list">{children}</ul>;
}
