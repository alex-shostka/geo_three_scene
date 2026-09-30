import { useAppSelector } from '../store/hooks';
import { selectAllTiles } from '../store/tilesSlice';
import { ErrorTileMesh } from './ErrorTileMesh';
import { ActiveTileMesh } from './ActiveTileMesh';
import { ERROR_TILE } from '../constants';

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
