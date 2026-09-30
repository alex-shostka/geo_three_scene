import { useAppSelector } from '../store/hooks';
import { selectAllTiles } from '../store/tilesSlice';
import { ErrorTileMesh } from './ErrorTileMesh';
import { ActiveTileMesh } from './ActiveTileMesh';

export function TileGroup() {
  const records = useAppSelector(selectAllTiles);

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
