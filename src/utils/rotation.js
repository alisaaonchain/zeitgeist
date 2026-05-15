import { NARRATIVES } from '../constants';

export function computeRotationFlows(narratives, events) {
  const ids = Object.keys(NARRATIVES);
  const map = new Map();

  events
    .filter((event) => event.type === 'ROTATION')
    .forEach((event) => {
      const from = event.fromNarrativeId || ids[(ids.indexOf(event.narrativeId) + 3) % ids.length];
      const to = event.toNarrativeId || event.narrativeId;
      if (!from || !to || from === to) return;
      const key = `${from}-${to}`;
      const current = map.get(key) || { from, to, strength: 0, volume: 0 };
      current.strength += 12;
      current.volume += 250000 + (narratives[to]?.totalVolume24h || 0) * 0.025;
      map.set(key, current);
    });

  const sorted = Object.values(narratives).sort((a, b) => b.momentumScore - a.momentumScore);
  for (let i = 0; i < Math.min(5, sorted.length - 1); i += 1) {
    const from = sorted[sorted.length - 1 - i]?.id;
    const to = sorted[i]?.id;
    if (!from || !to || from === to) continue;
    const key = `${from}-${to}`;
    if (map.has(key)) continue;
    map.set(key, {
      from,
      to,
      strength: Math.max(8, sorted[i].momentumScore - sorted[sorted.length - 1 - i].momentumScore),
      volume: Math.max(120000, sorted[i].totalVolume24h * 0.04),
    });
  }

  return [...map.values()].sort((a, b) => b.volume - a.volume).slice(0, 8);
}
