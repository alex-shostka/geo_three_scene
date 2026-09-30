export function formatTileError(rawError: unknown): string {
  if (rawError && typeof rawError === 'object') {
    const err = rawError as { statusCode?: number; message?: string };

    if (typeof err.statusCode === 'number') {
      return `HTTP ${err.statusCode}`;
    }

    if (typeof err.message === 'string' && err.message) {
      return err.message;
    }
  }

  if (typeof rawError === 'string' && rawError) {
    return rawError;
  }

  return 'Failed to load tile';
}
