interface FetchWithProgressOptions {
  signal?: AbortSignal;
  onProgress: (loaded: number, total: number | null) => void;
}

export async function fetchWithProgress(
  url: string,
  { signal, onProgress }: FetchWithProgressOptions,
): Promise<Uint8Array> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  if (!response.body) {
    throw new Error(`Empty response from ${url}`);
  }

  const total = Number(response.headers.get('Content-Length')) || null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    loaded += value.length;
    onProgress(loaded, total);
  }

  const result = new Uint8Array(loaded);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}
