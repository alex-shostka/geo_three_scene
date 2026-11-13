import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

let shouldThrow = true;

function Bomb() {
  if (shouldThrow) {
    throw new Error('Boom');
  }

  return <p>Recovered</p>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    shouldThrow = false;

    render(
      <ErrorBoundary fallback={(error) => <p>{error.message}</p>}>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('renders the fallback with the thrown error', () => {
    render(
      <ErrorBoundary fallback={(error) => <p>{error.message}</p>}>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Boom')).toBeInTheDocument();
  });

  it('renders the children again after reset', async () => {
    const user = userEvent.setup();

    render(
      <ErrorBoundary
        fallback={(_error, reset) => (
          <button type="button" onClick={reset}>
            Retry
          </button>
        )}
      >
        <Bomb />
      </ErrorBoundary>,
    );

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});
