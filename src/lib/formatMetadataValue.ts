export function formatMetadataValue(key: string, value: unknown): string {
  if (key === 'createTime' && typeof value === 'string') {
    return new Date(value).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }
  return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
}
