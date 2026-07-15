import { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { LEVEL_DEPTH, geoToScene } from '../lib/tileGeometry';
import { useTiles } from '../state/TilesContext';
import { useSettings } from '../state/SettingsContext';
import { useCesium } from '../state/CesiumContext';
import { useUi } from '../state/UiContext';
import type { ErrorTileRecord } from '../types';

const MAT_NORMAL = { color: 0xff2222, opacity: 0.55 };
const MAT_HOVER = { color: 0xff8800, opacity: 0.8 };

export function ErrorTileMesh({ record }: { record: ErrorTileRecord }) {
  const { hoveredTile, setHoveredTile } = useTiles();
  const { flyToTile } = useSettings();
  const { flyToTileData } = useCesium();
  const { setTooltip } = useUi();

  const { west, east, south, north, level, key } = record;
  const isHovered = hoveredTile?.type === 'error' && hoveredTile.key === key;
  const z = -level * LEVEL_DEPTH;
  const w = east - west;
  const h = north - south;
  const cx = (west + east) / 2;
  const cy = (south + north) / 2;
  const mat = isHovered ? MAT_HOVER : MAT_NORMAL;

  const outline = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      geoToScene(west, south, level),
      geoToScene(east, south, level),
      geoToScene(east, north, level),
      geoToScene(west, north, level),
      geoToScene(west, south, level),
    ]);
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xff0000 }));
  }, [west, east, south, north, level]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredTile({ type: 'error', key });
    setTooltip({ x: e.clientX, y: e.clientY, record });
  };
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isHovered) setTooltip({ x: e.clientX, y: e.clientY, record });
  };
  const handlePointerOut = () => {
    if (isHovered) {
      setHoveredTile(null);
      setTooltip(null);
    }
  };
  const handleClick = () => {
    if (flyToTile) flyToTileData({ west, east, south, north });
  };

  return (
    <group>
      <mesh
        position={[cx, cy, z]}
        onPointerOver={handlePointerOver}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={mat.color} transparent opacity={mat.opacity} depthWrite={false} />
      </mesh>
      <primitive object={outline} />
    </group>
  );
}
