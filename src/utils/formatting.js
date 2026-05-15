export function formatVolume(v = 0) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${Number(v || 0).toFixed(0)}`;
}

export function formatHolders(n = 0) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
}

export function formatPrice(p = 0) {
  if (p < 0.000001) return p.toExponential(2);
  if (p < 0.0001) return p.toFixed(6);
  if (p < 0.01) return p.toFixed(4);
  if (p < 1) return p.toFixed(3);
  if (p < 1000) return p.toFixed(2);
  return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
