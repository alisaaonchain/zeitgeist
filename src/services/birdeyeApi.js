const API_BASE = 'https://public-api.birdeye.so';
const REST_PROXY_BASE = getRestProxyBase();

export function hasDataGateway() {
  return REST_PROXY_BASE !== null;
}

export function createApiFetcher(apiKey) {
  return async function apiFetch(path) {
    try {
      const res = await fetchWithFallback(path, apiKey);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    } finally {
      await new Promise((r) => setTimeout(r, 150));
    }
  };
}

function getRestProxyBase() {
  const configured = import.meta.env.VITE_BIRDEYE_REST_PROXY_URL;
  if (configured) return configured.replace(/\/$/, '');
  return import.meta.env.PROD ? '' : null;
}

async function fetchWithFallback(path, apiKey) {
  if (REST_PROXY_BASE !== null) {
    const proxyPath = `${REST_PROXY_BASE}/api/birdeye?path=${encodeURIComponent(path)}`;
    try {
      const proxied = await fetch(proxyPath);
      if (proxied.ok || !apiKey) return proxied;
    } catch {
      if (!apiKey) throw new Error('REST proxy unavailable');
    }
  }

  return fetch(`${API_BASE}${path}`, {
    headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' },
  });
}
