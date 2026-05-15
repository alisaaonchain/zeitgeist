const API_BASE = 'https://public-api.birdeye.so';
const DATA_GATEWAY_URL = import.meta.env.VITE_DATA_GATEWAY_URL?.replace(/\/$/, '');

export function hasDataGateway() {
  return Boolean(DATA_GATEWAY_URL);
}

export function createApiFetcher(apiKey) {
  return async function apiFetch(path) {
    try {
      const url = DATA_GATEWAY_URL
        ? `${DATA_GATEWAY_URL}/api/birdeye?path=${encodeURIComponent(path)}`
        : `${API_BASE}${path}`;
      const res = await fetch(url, DATA_GATEWAY_URL ? {} : {
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
