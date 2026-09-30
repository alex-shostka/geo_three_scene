import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectHoveredTile } from '../store/tilesSlice';

export function HoverCursor() {
  const isHovering = useAppSelector((state) => selectHoveredTile(state) !== null);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    gl.domElement.style.cursor = isHovering ? 'pointer' : '';
  }, [isHovering, gl]);

  return null;
}
