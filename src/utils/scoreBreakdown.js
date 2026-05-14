export function getScoreBreakdown(narrative) {
  const tokens = narrative.tokens || [];
  const totalVolume = tokens.reduce((sum, token) => sum + (token.volume24h || 0), 0);
  const volumeScore = Math.min(30, Math.log10(totalVolume + 1) * 5);
  const newTokens = tokens.filter((token) => Date.now() - token.discoveredAt < 3600000).length;
  const launchScore = Math.min(25, newTokens * 5);
  const recentWhales = (narrative.whaleTrades || []).filter((trade) => Date.now() - trade.timestamp < 3600000);
  const whaleVolume = recentWhales.reduce((sum, trade) => sum + (trade.volumeUsd || 0), 0);
  const whaleScore = Math.min(25, Math.log10(whaleVolume + 1) * 4);
  const buyVolume = tokens.reduce((sum, token) => sum + (token.buyVolume || 0), 0);
  const sellVolume = tokens.reduce((sum, token) => sum + (token.sellVolume || 0), 0);
  const buyPressure = buyVolume / (buyVolume + sellVolume + 1);
  const pressureScore = Math.min(20, buyPressure * 20);
  const riskyTokens = tokens.filter((token) => token.securityRisk === 'HIGH').length;

  return {
    total: Math.round(volumeScore + launchScore + whaleScore + pressureScore),
    volumeScore,
    launchScore,
    whaleScore,
    pressureScore,
    totalVolume,
    newTokens,
    recentWhales: recentWhales.length,
    whaleVolume,
    buyVolume,
    sellVolume,
    buyPressure,
    riskyTokens,
  };
}

export function getAlphaCall(narrative) {
  if (narrative.stage === 'EMERGING') return 'EARLY';
  if (narrative.stage === 'HEATING') return narrative.momentumScore >= 70 ? 'MOMENTUM' : 'ACCELERATING';
  if (narrative.stage === 'PEAKING') return 'LATE';
  if (narrative.stage === 'COOLING') return 'FADING';
  return 'AVOID';
}
