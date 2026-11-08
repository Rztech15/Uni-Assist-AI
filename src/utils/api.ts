/**
 * Safe JSON fetch utility that prevents "Unexpected token '<' / 'The page c...'" crashes
 * when a server returns an HTML error page (e.g. 502/503/500).
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data;
  }

  // Non-JSON response (e.g. HTML error from proxy or Cloud Run)
  const text = await res.text();
  if (!res.ok) {
    if (text.includes('The page') || text.includes('502') || text.includes('503')) {
      throw new Error('Server is temporarily starting up. Please retry in a few seconds.');
    }
    throw new Error(`Server returned status ${res.status}: ${text.slice(0, 120)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Expected JSON response from server, but received non-JSON data.');
  }
}
