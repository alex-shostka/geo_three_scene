import type { KeyboardEvent, ReactNode } from 'react';

interface StatsTableRowProps {
  onClick?: () => void;
  children: ReactNode;
}

export function StatsTableRow({ onClick, children }: StatsTableRowProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <tr
      className={onClick ? 'stats-table-row' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      {children}
    </tr>
  );
}
