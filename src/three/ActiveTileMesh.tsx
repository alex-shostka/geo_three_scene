import { useMemo } from 'react';
import * as THREE from 'three';
import { LEVEL_DEPTH, geoToScene } from '../lib/tileGeometry';
import { useTiles } from '../state/TilesContext';
import { useSettings } from '../state/SettingsContext';
import { useCesium } from '../state/CesiumContext';
import type { ActiveTileRecord } from '../types';

export function ActiveTileMesh({ record }: { record: ActiveTileRecord }) {
  const { hoveredTile, setHoveredTile } = useTiles();
  const { activeTilesOnScene, flyToTile } = useSettings();
  const { flyToTileData } = useCesium();

  const { west, east, south, north, level, baseColor, key } = record;
  const z = -level * LEVEL_DEPTH;
  const w = east - west;
  const h = north - south;
  const cx = (west + east) / 2;
  const cy = (south + north) / 2;

  const isHovered = activeTilesOnScene && hoveredTile?.type === 'active' && hoveredTile.key === key;

  const outline = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      geoToScene(west, south, level),
      geoToScene(east, south, level),
      geoToScene(east, north, level),
      geoToScene(west, north, level),
      geoToScene(west, south, level),
    ]);
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: baseColor }));
  }, [west, east, south, north, level, baseColor]);

  const handlePointerOver = () => {
    if (activeTilesOnScene) setHoveredTile({ type: 'active', key });
  };
  const handlePointerOut = () => {
    if (hoveredTile?.type === 'active' && hoveredTile.key === key) setHoveredTile(null);
  };
  const handleClick = () => {
    if (activeTilesOnScene && flyToTile) flyToTileData({ west, east, south, north });
  };

  return (
    <group>
      <primitive object={outline} />
      <mesh
        position={[cx, cy, z - 0.01]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={baseColor} transparent opacity={isHovered ? 0.15 : 0} depthWrite={false} />
      </mesh>
    </group>
  );
}
