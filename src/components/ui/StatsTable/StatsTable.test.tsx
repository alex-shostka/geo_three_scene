import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StatsTable } from './index';

interface Item {
  name: string;
  value: number;
}

const ITEMS: Item[] = [
  { name: 'Alpha', value: 1 },
  { name: 'Beta', value: 2 },
];

function renderTable(rows: Item[], onRowClick?: (item: Item) => void) {
  render(
    <StatsTable
      columns={['Name', 'Value']}
      rows={rows}
      getRowKey={(item) => item.name}
      emptyText="Nothing yet"
      renderRow={(item) => (
        <StatsTable.Row onClick={onRowClick ? () => onRowClick(item) : undefined}>
          <td>{item.name}</td>
          <td>{item.value}</td>
        </StatsTable.Row>
      )}
    />,
  );
}

function bodyRows() {
  const [, body] = screen.getAllByRole('rowgroup');

  if (!body) {
    throw new Error('Table body not found');
  }

  return within(body).getAllByRole('row');
}

describe('StatsTable', () => {
  it('renders a header cell per column', () => {
    renderTable(ITEMS);

    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Name', 'Value']);
  });

  it('renders a row per item in order', () => {
    renderTable(ITEMS);

    expect(bodyRows().map((row) => row.textContent)).toEqual(['Alpha1', 'Beta2']);
  });

  it('shows the empty text across all columns when there are no rows', () => {
    renderTable([]);

    expect(screen.getByRole('cell', { name: 'Nothing yet' })).toHaveAttribute('colspan', '2');
  });
});

describe('StatsTable.Row', () => {
  it('is not focusable or styled as clickable without onClick', () => {
    renderTable(ITEMS);

    const [row] = bodyRows();

    expect(row).not.toHaveAttribute('tabindex');
    expect(row).not.toHaveClass('stats-table-row');
  });

  it('is focusable and styled as clickable with onClick', () => {
    renderTable(ITEMS, vi.fn());

    const [row] = bodyRows();

    expect(row).toHaveAttribute('tabindex', '0');
    expect(row).toHaveClass('stats-table-row');
  });

  it('reports the clicked item', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn<(item: Item) => void>();

    renderTable(ITEMS, onRowClick);
    await user.click(screen.getByRole('row', { name: /Beta/ }));

    expect(onRowClick).toHaveBeenCalledWith(ITEMS[1]);
  });

  it.each(['{Enter}', ' '])('reports the focused item on %s', async (key) => {
    const user = userEvent.setup();
    const onRowClick = vi.fn<(item: Item) => void>();

    renderTable(ITEMS, onRowClick);
    await user.tab();
    await user.keyboard(key);

    expect(onRowClick).toHaveBeenCalledWith(ITEMS[0]);
  });
});
