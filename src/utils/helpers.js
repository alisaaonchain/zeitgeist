export function shortAddress(address) {
  if (!address) return '\u2014';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function seededNumber(seed, mod = 1000) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 2147483647;
  return h % mod;
}

export function mockAddress(seed) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let out = '';
  let n = seededNumber(seed, 100000) + 777;
  for (let i = 0; i < 44; i += 1) {
    n = (n * 48271 + i + seed.length) % 2147483647;
    out += alphabet[n % alphabet.length];
  }
  return out;
}

export function makeSparkline(seed, count = 24, trend = 1) {
  const base = 20 + seededNumber(seed, 80);
  return Array.from({ length: count }, (_, i) => {
    const wave = Math.sin((i + seededNumber(seed, 7)) / 2.4) * 4;
    const drift = i * trend * 0.9;
    const jitter = ((seededNumber(`${seed}-${i}`, 100) / 100) - 0.5) * 5;
    return Math.max(1, Number((base + wave + drift + jitter).toFixed(2)));
  });
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeTokenList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.tokens)) return payload.data.tokens;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}
