import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TileGroup } from './TileGroup';
import { CameraRig } from './CameraRig';
import { HoverCursor } from './HoverCursor';

export function ThreeOverlay() {
  return (
    <div id="three-canvas" style={{ width: 600, height: 400 }}>
      <Canvas camera={{ fov: 60, near: 0.1, far: 10000 }} gl={{ antialias: true }}>
        <color attach="background" args={[0x1a1a2e]} />
        <TileGroup />
        <CameraRig />
        <HoverCursor />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={0.1} maxDistance={5000} />
      </Canvas>
    </div>
  );
}
