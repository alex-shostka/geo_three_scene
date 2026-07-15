import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ActiveTileRecord, ErrorTileRecord, FocusBounds, HoveredTile, TileRecord } from '../types';

interface TilesContextValue {
  tiles: Map<string, TileRecord>;
  addErrorTile: (tile: ErrorTileRecord) => void;
  addActiveTiles: (tiles: ActiveTileRecord[]) => void;
  hoveredTile: HoveredTile | null;
  setHoveredTile: (tile: HoveredTile | null) => void;
  focusBounds: FocusBounds | null;
  setFocusBounds: (bounds: FocusBounds | null) => void;
}

const TilesContext = createContext<TilesContextValue | null>(null);

export function TilesProvider({ children }: { children: ReactNode }) {
  const [tiles, setTiles] = useState<Map<string, TileRecord>>(() => new Map());
  const [hoveredTile, setHoveredTile] = useState<HoveredTile | null>(null);
  const [focusBounds, setFocusBounds] = useState<FocusBounds | null>(null);

  const addErrorTile = useCallback((tile: ErrorTileRecord) => {
    setTiles((prev) => {
      if (prev.has(tile.key)) return prev;
      const next = new Map(prev);
      next.set(tile.key, tile);
      return next;
    });
  }, []);

  const addActiveTiles = useCallback((newTiles: ActiveTileRecord[]) => {
    setTiles((prev) => {
      const fresh = newTiles.filter((t) => !prev.has(t.key));
      if (!fresh.length) return prev;
      const next = new Map(prev);
      fresh.forEach((t) => next.set(t.key, t));
      return next;
    });
  }, []);

  const value = useMemo<TilesContextValue>(() => ({
    tiles, addErrorTile, addActiveTiles, hoveredTile, setHoveredTile, focusBounds, setFocusBounds,
  }), [tiles, addErrorTile, addActiveTiles, hoveredTile, focusBounds]);

  return <TilesContext.Provider value={value}>{children}</TilesContext.Provider>;
}

export function useTiles(): TilesContextValue {
  const ctx = useContext(TilesContext);
  if (!ctx) throw new Error('useTiles must be used within TilesProvider');
  return ctx;
}
