import { useMemo } from 'react';
import { useTiles } from '../state/TilesContext';
import { ErrorTileMesh } from './ErrorTileMesh';
import { ActiveTileMesh } from './ActiveTileMesh';

export function TileGroup() {
  const { tiles } = useTiles();
  const records = useMemo(() => Array.from(tiles.values()), [tiles]);

  return (
    <group>
      {records.map((record) => (
        record.type === 'error'
          ? <ErrorTileMesh key={record.key} record={record} />
          : <ActiveTileMesh key={record.key} record={record} />
      ))}
    </group>
  );
}
