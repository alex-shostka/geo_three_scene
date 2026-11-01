import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Settings } from './index';

const noop = () => {};

function renderGroup(groupChecked: boolean) {
  render(
    <Settings>
      <Settings.Group label="Active tiles" checked={groupChecked} onChange={noop}>
        <Settings.Toggle label="Fly to tile" checked={false} onChange={noop} />
      </Settings.Group>
    </Settings>,
  );
}

describe('Settings.Group', () => {
  it('enables its children when it is on', () => {
    renderGroup(true);

    expect(screen.getByRole('checkbox', { name: 'Fly to tile' })).toBeEnabled();
  });

  it('disables its children when it is off', () => {
    renderGroup(false);

    expect(screen.getByRole('checkbox', { name: 'Fly to tile' })).toBeDisabled();
  });

  it('keeps its own switch enabled when it is off', () => {
    renderGroup(false);

    expect(screen.getByRole('checkbox', { name: 'Active tiles' })).toBeEnabled();
  });

  it('labels the nested list with its own label', () => {
    renderGroup(true);

    expect(screen.getByRole('list', { name: 'Active tiles' })).toBeInTheDocument();
  });

  it('reports the new value when its switch is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(checked: boolean) => void>();

    render(
      <Settings>
        <Settings.Group label="Active tiles" checked={false} onChange={onChange}>
          <Settings.Toggle label="Fly to tile" checked={false} onChange={noop} />
        </Settings.Group>
      </Settings>,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Active tiles' }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('disables a nested group and its children when the outer group is off', () => {
    render(
      <Settings>
        <Settings.Group label="Outer" checked={false} onChange={noop}>
          <Settings.Group label="Inner" checked onChange={noop}>
            <Settings.Toggle label="Leaf" checked={false} onChange={noop} />
          </Settings.Group>
        </Settings.Group>
      </Settings>,
    );

    expect(screen.getByRole('checkbox', { name: 'Inner' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Leaf' })).toBeDisabled();
  });
});
