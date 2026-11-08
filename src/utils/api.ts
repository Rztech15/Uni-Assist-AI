/**
 * Safe JSON fetch utility that prevents "Unexpected token '<' / 'The page c...'" crashes
 * and automatically retries transient cloud container cold-starts/502/503 proxy errors.
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 2
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init);
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Request failed with status ${res.status}`);
        }
        return data as T;
      }

      // Non-JSON response (e.g. HTML error from proxy or Cloud Run)
      const text = await res.text();
      const isTransientGateway =
        !res.ok &&
        (text.includes('The page') ||
          text.includes('502') ||
          text.includes('503') ||
          res.status === 502 ||
          res.status === 503);

      if (isTransientGateway && attempt < retries) {
        // Wait 1.2s for server container to finish starting up before retry
        await new Promise((resolve) => setTimeout(resolve, 1200));
        continue;
      }

      if (!res.ok) {
        if (text.includes('The page') || text.includes('502') || text.includes('503')) {
          throw new Error('Server is temporarily starting up. Please retry in a few seconds.');
        }
        throw new Error(`Server returned status ${res.status}: ${text.slice(0, 120)}`);
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error('Expected JSON response from server, but received non-JSON data.');
      }
    } catch (err: any) {
      if (
        attempt < retries &&
        (err.message?.includes('Failed to fetch') ||
          err.message?.includes('NetworkError') ||
          err.message?.includes('temporarily starting up'))
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Server is temporarily starting up. Please retry in a few seconds.');
}
