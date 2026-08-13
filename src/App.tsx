import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { SettingsProvider } from './state/SettingsContext';
import { TilesProvider } from './state/TilesContext';
import { CesiumProvider } from './state/CesiumContext';
import { UiProvider } from './state/UiContext';
import { CesiumGlobe } from './cesium/CesiumGlobe';
import { ThreeOverlay } from './three/ThreeOverlay';
import { HamburgerMenu } from './components/HamburgerMenu';
import { SidePanel } from './components/SidePanel';
import { AnalyticsButton } from './components/AnalyticsButton';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { NetworkButton } from './components/NetworkButton';
import { NetworkPanel } from './components/NetworkPanel';
import { TileTooltip } from './components/TileTooltip';
import { TileCard } from './components/TileCard';
import { Footer } from './components/Footer';
import { MapControls } from './components/MapControls';

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
            <AnalyticsButton />
            <AnalyticsPanel />
            <NetworkButton />
            <NetworkPanel />
            <TileTooltip />
            <TileCard />
            <MapControls />
            <Footer />
          </UiProvider>
        </CesiumProvider>
      </TilesProvider>
      <Analytics />
      <SpeedInsights />
    </SettingsProvider>
  );
}
