import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface SettingsState {
  activeTilesOnScene: boolean;
  flyToTile: boolean;
  tileGridOnGlobe: boolean;
  glbTiles: boolean;
  glbMetadata: boolean;
  showTooltips: boolean;
}

interface SettingsContextValue extends SettingsState {
  setActiveTilesOnScene: (value: boolean) => void;
  setFlyToTile: (value: boolean) => void;
  setTileGridOnGlobe: (value: boolean) => void;
  setGlbTiles: (value: boolean) => void;
  setGlbMetadata: (value: boolean) => void;
  setShowTooltips: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SettingsState>({
    activeTilesOnScene: false,
    flyToTile: false,
    tileGridOnGlobe: false,
    glbTiles: false,
    glbMetadata: false,
    showTooltips: true,
  });

  const value = useMemo<SettingsContextValue>(() => ({
    ...state,
    // Turning off "active tiles" also disables & resets the dependent "fly to tile" toggle.
    setActiveTilesOnScene: (value) => setState((s) => ({
      ...s,
      activeTilesOnScene: value,
      flyToTile: value ? s.flyToTile : false,
    })),
    setFlyToTile: (value) => setState((s) => ({ ...s, flyToTile: value })),
    setTileGridOnGlobe: (value) => setState((s) => ({ ...s, tileGridOnGlobe: value })),
    // Turning off "GLB tiles" also disables & resets the dependent "GLB metadata" toggle.
    setGlbTiles: (value) => setState((s) => ({
      ...s,
      glbTiles: value,
      glbMetadata: value ? s.glbMetadata : false,
    })),
    setGlbMetadata: (value) => setState((s) => ({ ...s, glbMetadata: value })),
    setShowTooltips: (value) => setState((s) => ({ ...s, showTooltips: value })),
  }), [state]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
