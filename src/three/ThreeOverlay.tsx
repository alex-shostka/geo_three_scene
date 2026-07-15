import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TileGroup } from './TileGroup';
import { CameraRig } from './CameraRig';
import { HoverCursor } from './HoverCursor';
import { useCornerResize, type SetCanvasSize } from './useCornerResize';
import { useDragMove } from './useDragMove';
import { CanvasResizeBridge } from './CanvasResizeBridge';

export function ThreeOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const setSizeRef = useRef<SetCanvasSize | null>(null);
  const startResize = useCornerResize(containerRef, setSizeRef);
  const startDrag = useDragMove(containerRef);

  return (
    <div id="three-canvas" ref={containerRef}>
      <Canvas camera={{ fov: 60, near: 0.1, far: 10000 }} gl={{ antialias: true }}>
        <CanvasResizeBridge setSizeRef={setSizeRef} />
        <color attach="background" args={[0x1a1a2e]} />
        <TileGroup />
        <CameraRig />
        <HoverCursor />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={0.1} maxDistance={5000} />
      </Canvas>
      <div className="drag-handle" onPointerDown={startDrag} />
      <div className="resize-handle resize-handle--nw" onPointerDown={startResize('nw')} />
      <div className="resize-handle resize-handle--ne" onPointerDown={startResize('ne')} />
      <div className="resize-handle resize-handle--sw" onPointerDown={startResize('sw')} />
      <div className="resize-handle resize-handle--se" onPointerDown={startResize('se')} />
    </div>
  );
}
