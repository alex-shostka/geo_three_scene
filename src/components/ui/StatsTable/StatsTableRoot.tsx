import type { ReactNode } from 'react';

interface StatsTableProps<T> {
  columns: string[];
  rows: T[];
  emptyText: string;
  renderRow: (row: T) => ReactNode;
}

export function StatsTable<T>({ columns, rows, emptyText, renderRow }: StatsTableProps<T>) {
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
          rows.map((row) => renderRow(row))
        )}
      </tbody>
    </table>
  );
}
