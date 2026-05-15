const API_BASE = 'https://public-api.birdeye.so';

export function createApiFetcher(apiKey) {
  return async function apiFetch(path) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    } finally {
      await new Promise((r) => setTimeout(r, 150));
    }
  };
}
