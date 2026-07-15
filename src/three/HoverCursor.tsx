import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useTiles } from '../state/TilesContext';

export function HoverCursor() {
  const { hoveredTile } = useTiles();
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    gl.domElement.style.cursor = hoveredTile ? 'pointer' : '';
  }, [hoveredTile, gl]);

  return null;
}
