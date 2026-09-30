import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { CesiumGlobe } from './cesium/CesiumGlobe';
import { AnalyticsButton } from './components/AnalyticsButton';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { Footer } from './components/Footer';
import { HamburgerMenu } from './components/HamburgerMenu';
import { MapControls } from './components/MapControls';
import { NetworkButton } from './components/NetworkButton';
import { NetworkPanel } from './components/NetworkPanel';
import { SidePanel } from './components/SidePanel';
import { TileCard } from './components/TileCard';
import { TileTooltip } from './components/TileTooltip';
import { ThreeOverlay } from './three/ThreeOverlay';

export function App() {
  return (
    <>
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
      <Analytics />
      <SpeedInsights />
    </>
  );
}
