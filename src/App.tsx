import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { CesiumGlobe } from './cesium/CesiumGlobe';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { AppFooter } from './components/AppFooter';
import { BenchmarkPanel } from './components/BenchmarkPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
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
      <ErrorBoundary fallback={() => null}>
        <SidePanel />
      </ErrorBoundary>
      <ErrorBoundary fallback={() => null}>
        <AnalyticsPanel />
      </ErrorBoundary>
      <ErrorBoundary fallback={() => null}>
        <NetworkPanel />
      </ErrorBoundary>
      <ErrorBoundary fallback={() => null}>
        <BenchmarkPanel />
      </ErrorBoundary>
      <TileTooltip />
      <TileCard />
      <MapControls />
      <AppFooter />
      {import.meta.env.PROD && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </>
  );
}
