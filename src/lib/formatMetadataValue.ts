const CREATE_TIME_KEY = 'createTime';
const DATE_LOCALE = 'ru-RU';

export function formatMetadataValue(key: string, value: unknown): string {
  if (key === CREATE_TIME_KEY && typeof value === 'string') {
    return new Date(value).toLocaleString(DATE_LOCALE, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
}
