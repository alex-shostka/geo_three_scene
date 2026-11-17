import { useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import type { SetCanvasSizeRef } from './useCornerResize';

export function CanvasResizeBridge({ setSizeRef }: { setSizeRef: SetCanvasSizeRef }) {
  const setSize = useThree((state) => state.setSize);

  useLayoutEffect(() => {
    setSizeRef.current = setSize;

    return () => {
      setSizeRef.current = null;
    };
  }, [setSize, setSizeRef]);

  return null;
}
