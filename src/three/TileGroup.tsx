import { ERROR_TILE } from '../constants';
import { useAppSelector } from '../store/hooks';
import { selectAllTiles } from '../store/tilesSlice';
import { ActiveTileMesh } from './ActiveTileMesh';
import { ErrorTileMesh } from './ErrorTileMesh';

export function TileGroup() {
  const records = useAppSelector(selectAllTiles);

  return (
    <group>
      {records.map((record) =>
        record.type === ERROR_TILE ? (
          <ErrorTileMesh key={record.key} record={record} />
        ) : (
          <ActiveTileMesh key={record.key} record={record} />
        ),
      )}
    </group>
  );
}
