import type { ThreeEvent } from '@react-three/fiber';
import { flyCameraToTile } from '../cesium/viewerStore';
import { ERROR_TILE } from '../constants';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectFlyToTile } from '../store/settingsSlice';
import { selectIsTileHovered, setHoveredTile } from '../store/tilesSlice';
import { setTooltip } from '../store/uiSlice';
import type { ErrorTileRecord } from '../types';
import { useTileShape } from './useTileShape';

const MAT_NORMAL = { color: 0xff2222, opacity: 0.55 };
const MAT_HOVER = { color: 0xff8800, opacity: 0.8 };
const OUTLINE_COLOR = 0xff0000;

export function ErrorTileMesh({ record }: { record: ErrorTileRecord }) {
  const flyToTile = useAppSelector(selectFlyToTile);
  const dispatch = useAppDispatch();

  const { west, east, south, north, key } = record;
  const isHovered = useAppSelector((state) => selectIsTileHovered(state, ERROR_TILE, key));
  const { outline, center, size } = useTileShape(record, OUTLINE_COLOR);
  const mat = isHovered ? MAT_HOVER : MAT_NORMAL;

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    dispatch(setHoveredTile({ type: ERROR_TILE, key }));
    dispatch(setTooltip({ x: event.clientX, y: event.clientY, record }));
  };
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (isHovered) {
      dispatch(setTooltip({ x: event.clientX, y: event.clientY, record }));
    }
  };
  const handlePointerOut = () => {
    if (isHovered) {
      dispatch(setHoveredTile(null));
      dispatch(setTooltip(null));
    }
  };
  const handleClick = () => {
    if (flyToTile) {
      flyCameraToTile({ west, east, south, north });
    }
  };

  return (
    <group>
      <mesh
        position={[center.x, center.y, center.z]}
        onPointerOver={handlePointerOver}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <planeGeometry args={size} />
        <meshBasicMaterial color={mat.color} transparent opacity={mat.opacity} depthWrite={false} />
      </mesh>
      <primitive object={outline} />
    </group>
  );
}
