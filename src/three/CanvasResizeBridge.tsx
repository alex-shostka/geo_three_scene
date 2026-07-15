import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { SetCanvasSizeRef } from './useCornerResize';

export function CanvasResizeBridge({ setSizeRef }: { setSizeRef: SetCanvasSizeRef }) {
  const setSize = useThree((state) => state.setSize);
  useEffect(() => {
    setSizeRef.current = setSize;
    return () => { setSizeRef.current = null; };
  }, [setSize, setSizeRef]);
  return null;
}
