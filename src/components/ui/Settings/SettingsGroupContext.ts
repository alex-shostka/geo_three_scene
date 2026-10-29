import { createContext, use } from 'react';

interface SettingsGroupContextValue {
  disabled: boolean;
}

export const SettingsGroupContext = createContext<SettingsGroupContextValue>({ disabled: false });

export function useSettingsGroup(): SettingsGroupContextValue {
  return use(SettingsGroupContext);
}
