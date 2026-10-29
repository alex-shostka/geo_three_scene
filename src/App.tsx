import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { CesiumGlobe } from './cesium/CesiumGlobe';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { BenchmarkPanel } from './components/BenchmarkPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { MapControls } from './components/MapControls';
import { NetworkPanel } from './components/NetworkPanel';
import { SidePanel } from './components/SidePanel';
import { TileCard } from './components/TileCard';
import { TileTooltip } from './components/TileTooltip';
import { ThreeOverlay } from './three/ThreeOverlay';

export function App() {
  return (
    <>
      <CesiumGlobe />
      <ErrorBoundary fallback={() => null}>
        <ThreeOverlay />
      </ErrorBoundary>
      <SidePanel />
      <AnalyticsPanel />
      <NetworkPanel />
      <BenchmarkPanel />
      <TileTooltip />
      <TileCard />
      <MapControls />
      <Footer />
      {import.meta.env.PROD && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </>
  );
}
