import { SettingsGroup } from './SettingsGroup';
import { SettingsList } from './SettingsList';
import { SettingsToggle } from './SettingsToggle';

export const Settings = Object.assign(SettingsList, {
  Toggle: SettingsToggle,
  Group: SettingsGroup,
});
