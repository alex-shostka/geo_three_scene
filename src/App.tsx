import { Analytics } from '@vercel/analytics/react';
import { SettingsProvider } from './state/SettingsContext';
import { TilesProvider } from './state/TilesContext';
import { CesiumProvider } from './state/CesiumContext';
import { UiProvider } from './state/UiContext';
import { CesiumGlobe } from './cesium/CesiumGlobe';
import { ThreeOverlay } from './three/ThreeOverlay';
import { HamburgerMenu } from './components/HamburgerMenu';
import { SidePanel } from './components/SidePanel';
import { TileHud } from './components/TileHud';
import { TileTooltip } from './components/TileTooltip';
import { TileCard } from './components/TileCard';

export function App() {
  return (
    <SettingsProvider>
      <TilesProvider>
        <CesiumProvider>
          <UiProvider>
            <CesiumGlobe />
            <ThreeOverlay />
            <HamburgerMenu />
            <SidePanel />
            <TileHud />
            <TileTooltip />
            <TileCard />
          </UiProvider>
        </CesiumProvider>
      </TilesProvider>
      <Analytics />
    </SettingsProvider>
  );
}
