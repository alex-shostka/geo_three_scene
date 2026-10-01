import type { ThreeEvent } from '@react-three/fiber';
import { flyCameraToTile } from '../cesium/viewerStore';
import { ACTIVE_TILE } from '../constants';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectActiveTilesOnScene, selectFlyToTile } from '../store/settingsSlice';
import { selectIsTileHovered, setHoveredTile } from '../store/tilesSlice';
import type { ActiveTileRecord } from '../types';
import { useTileShape } from './useTileShape';

export function ActiveTileMesh({ record }: { record: ActiveTileRecord }) {
  const activeTilesOnScene = useAppSelector(selectActiveTilesOnScene);
  const flyToTile = useAppSelector(selectFlyToTile);
  const dispatch = useAppDispatch();

  const { west, east, south, north, baseColor, key } = record;
  const { outline, center, size } = useTileShape(record, baseColor);

  const isHoveredInStore = useAppSelector((state) => selectIsTileHovered(state, ACTIVE_TILE, key));
  const isHovered = activeTilesOnScene && isHoveredInStore;

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
        position={[center.x, center.y, center.z - 0.01]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <planeGeometry args={size} />
        <meshBasicMaterial color={baseColor} transparent opacity={isHovered ? 0.15 : 0} depthWrite={false} />
      </mesh>
    </group>
  );
}
