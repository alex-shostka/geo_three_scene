export function formatTileError(rawError: unknown): string {
  if (rawError && typeof rawError === 'object') {
    if ('statusCode' in rawError && typeof rawError.statusCode === 'number') {
      return `HTTP ${rawError.statusCode}`;
    }

    if ('message' in rawError && typeof rawError.message === 'string' && rawError.message) {
      return rawError.message;
    }
  }

  if (typeof rawError === 'string' && rawError) {
    return rawError;
  }

  return 'Failed to load tile';
}
