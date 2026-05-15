export function computeNarrativeScore(narrative) {
  const tokens = narrative.tokens || [];
  const totalVolume = tokens.reduce((s, t) => s + (t.volume24h || 0), 0);
  const volumeScore = Math.min(30, Math.log10(totalVolume + 1) * 5);
  const newTokens = tokens.filter((t) => Date.now() - t.discoveredAt < 3600000).length;
  const launchScore = Math.min(25, newTokens * 5);
  const whaleVol = (narrative.whaleTrades || [])
    .filter((t) => Date.now() - t.timestamp < 3600000)
    .reduce((s, t) => s + (t.volumeUsd || 0), 0);
  const whaleScore = Math.min(25, Math.log10(whaleVol + 1) * 4);
  const buys = tokens.reduce((s, t) => s + (t.buyVolume || 0), 0);
  const sells = tokens.reduce((s, t) => s + (t.sellVolume || 0), 0);
  const ratio = buys / (buys + sells + 1);
  const pressureScore = Math.min(20, ratio * 20);
  return Math.max(0, Math.min(100, Math.round(volumeScore + launchScore + whaleScore + pressureScore)));
}

export function computeStage(narrative, scoreHistory) {
  const current = narrative.momentumScore;
  const history = scoreHistory[narrative.id] || [current];
  const trend = current - (history[history.length - 2] || current);
  const avgAge =
    (narrative.tokens || []).reduce((s, t) => s + (Date.now() - t.discoveredAt), 0) /
    ((narrative.tokens || []).length || 1) /
    3600000;
  if (current < 15) return 'DEAD';
  if (current < 30 && trend >= 0 && avgAge < 2) return 'EMERGING';
  if (current >= 30 && trend > 2) return 'HEATING';
  if (current >= 60 && Math.abs(trend) < 2) return 'PEAKING';
  if (trend < -3) return 'COOLING';
  if (current >= 30) return 'HEATING';
  return 'EMERGING';
}

export function recomputeNarrative(narrative, scoreHistoryRef) {
  const tokens = narrative.tokens || [];
  const totalVolume24h = tokens.reduce((s, t) => s + (t.volume24h || 0), 0);
  const totalHolders = tokens.reduce((s, t) => s + (t.holderCount || 0), 0);
  const buys = tokens.reduce((s, t) => s + (t.buyVolume || 0), 0);
  const sells = tokens.reduce((s, t) => s + (t.sellVolume || 0), 0);
  const draft = {
    ...narrative,
    totalVolume24h,
    totalHolders,
    totalBuyPressure: buys / (buys + sells + 1),
    newTokensLastHour: tokens.filter((t) => Date.now() - t.discoveredAt < 3600000).length,
  };
  const momentumScore = computeNarrativeScore(draft);
  const history = [...(scoreHistoryRef.current[draft.id] || []), momentumScore].slice(-24);
  scoreHistoryRef.current[draft.id] = history;
  const stage = computeStage({ ...draft, momentumScore }, scoreHistoryRef.current);
  return {
    ...draft,
    momentumScore,
    stage,
    stageChangedAt: stage !== narrative.stage ? Date.now() : narrative.stageChangedAt,
    sparkline: history,
    lastUpdated: Date.now(),
  };
}
