import { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { LEVEL_DEPTH, geoToScene } from '../lib/tileGeometry';
import { flyCameraToTile } from '../cesium/viewerStore';
import type { ActiveTileRecord } from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectActiveTilesOnScene, selectFlyToTile } from '../store/settingsSlice';
import { selectIsTileHovered, setHoveredTile } from '../store/tilesSlice';
import { ACTIVE_TILE } from '../constants';

export function ActiveTileMesh({ record }: { record: ActiveTileRecord }) {
  const activeTilesOnScene = useAppSelector(selectActiveTilesOnScene);
  const flyToTile = useAppSelector(selectFlyToTile);
  const dispatch = useAppDispatch();

  const { west, east, south, north, level, baseColor, key } = record;
  const z = -level * LEVEL_DEPTH;
  const w = east - west;
  const h = north - south;
  const cx = (west + east) / 2;
  const cy = (south + north) / 2;

  const isHoveredInStore = useAppSelector((state) => selectIsTileHovered(state, ACTIVE_TILE, key));
  const isHovered = activeTilesOnScene && isHoveredInStore;

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

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    if (activeTilesOnScene) {
      dispatch(setHoveredTile({ type: ACTIVE_TILE, key }));
    }
  };
  const handlePointerOut = () => {
    if (isHoveredInStore) {
      dispatch(setHoveredTile(null));
    }
  };
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (activeTilesOnScene && flyToTile) {
      flyCameraToTile({ west, east, south, north });
    }
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
