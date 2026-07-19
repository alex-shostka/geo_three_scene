import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useTiles } from '../state/TilesContext';
import { LEVEL_DEPTH, levelColor } from '../lib/tileGeometry';

interface Tick {
  level: number;
  z: number;
  color: number;
  line: THREE.Line;
}

/**
 * Vertical scale ruler next to the rendered tile stack: one tick + label per
 * zoom level currently present in `tiles`, positioned at that level's own
 * Z-plane (see geoToScene) so it reads as a depth axis for the stack.
 */
export function LevelAxis() {
  const { tiles } = useTiles();

  const layout = useMemo(() => {
    if (!tiles.size) return null;

    let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity;
    const levels = new Set<number>();
    tiles.forEach((tile) => {
      if (tile.west < west) west = tile.west;
      if (tile.east > east) east = tile.east;
      if (tile.south < south) south = tile.south;
      if (tile.north > north) north = tile.north;
      levels.add(tile.level);
    });

    const span = Math.max(east - west, north - south) || 1;
    const margin = span * 0.12;
    const axisX = west - margin;
    const axisY = south - margin;
    const tickLength = span * 0.05;
    const maxLevel = Math.max(...levels);

    const spine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(axisX, axisY, 0),
        new THREE.Vector3(axisX, axisY, -maxLevel * LEVEL_DEPTH),
      ]),
      new THREE.LineBasicMaterial({ color: 0x8888aa }),
    );

    const ticks: Tick[] = Array.from(levels).sort((a, b) => a - b).map((level) => {
      const z = -level * LEVEL_DEPTH;
      const color = levelColor(level);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(axisX, axisY, z),
          new THREE.Vector3(axisX + tickLength, axisY, z),
        ]),
        new THREE.LineBasicMaterial({ color }),
      );
      return { level, z, color, line };
    });

    return { axisX, axisY, tickLength, spine, ticks };
  }, [tiles]);

  if (!layout) return null;

  return (
    <group>
      <primitive object={layout.spine} />
      {layout.ticks.map(({ level, z, color, line }) => (
        <group key={level}>
          <primitive object={line} />
          <Text
            position={[layout.axisX - layout.tickLength * 0.5, layout.axisY, z]}
            fontSize={layout.tickLength}
            color={color}
            anchorX="right"
            anchorY="middle"
          >
            {`L${level}`}
          </Text>
        </group>
      ))}
    </group>
  );
}
