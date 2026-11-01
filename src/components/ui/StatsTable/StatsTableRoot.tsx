import { Fragment, type Key, type ReactNode } from 'react';

interface StatsTableRootProps<T> {
  columns: string[];
  rows: T[];
  getRowKey: (row: T) => Key;
  emptyText: string;
  renderRow: (row: T) => ReactNode;
}

export function StatsTableRoot<T>({ columns, rows, getRowKey, emptyText, renderRow }: StatsTableRootProps<T>) {
  return (
    <table className="stats-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td className="stats-table-empty" colSpan={columns.length}>
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((row) => <Fragment key={getRowKey(row)}>{renderRow(row)}</Fragment>)
        )}
      </tbody>
    </table>
  );
}
