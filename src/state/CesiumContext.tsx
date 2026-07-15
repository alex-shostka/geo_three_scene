import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Cartesian3, type Entity, type Viewer } from 'cesium';
import type { TileBounds } from '../types';

interface CesiumHandles {
  viewer: Viewer | null;
  hoverEntity: Entity | null;
}

interface CesiumContextValue extends CesiumHandles {
  setCesiumHandles: (handles: CesiumHandles) => void;
  flyToTileData: (bounds: TileBounds) => void;
}

const CesiumContext = createContext<CesiumContextValue | null>(null);

export function CesiumProvider({ children }: { children: ReactNode }) {
  const [handles, setHandles] = useState<CesiumHandles>({ viewer: null, hoverEntity: null });

  const setCesiumHandles = useCallback((next: CesiumHandles) => setHandles(next), []);

  // Keeps the current camera height so zooming out to fly doesn't rebuild the tile grid.
  const flyToTileData = useCallback((bounds: TileBounds) => {
    const { viewer } = handles;
    if (!viewer) return;
    const centerLon = (bounds.west + bounds.east) / 2;
    const centerLat = (bounds.south + bounds.north) / 2;
    const currentHeight = viewer.camera.positionCartographic.height;
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(centerLon, centerLat, currentHeight),
      duration: 1.5,
    });
  }, [handles]);

  const value = useMemo<CesiumContextValue>(() => ({
    ...handles, setCesiumHandles, flyToTileData,
  }), [handles, setCesiumHandles, flyToTileData]);

  return <CesiumContext.Provider value={value}>{children}</CesiumContext.Provider>;
}

export function useCesium(): CesiumContextValue {
  const ctx = useContext(CesiumContext);
  if (!ctx) throw new Error('useCesium must be used within CesiumProvider');
  return ctx;
}
