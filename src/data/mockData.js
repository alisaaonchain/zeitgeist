import { NARRATIVES } from '../constants';
import { seededNumber, mockAddress, makeSparkline, formatVolume, shortAddress } from '../utils';

const MOCK_BLUEPRINT = {
  AI: { momentumScore: 82, stage: 'HEATING', totalHolders: 142000, totalVolume24h: 18400000, tokenCount: 8, whaleTrades: 3 },
  MEME: { momentumScore: 91, stage: 'PEAKING', totalHolders: 480000, totalVolume24h: 48200000, tokenCount: 14, whaleTrades: 7 },
  GAMING: { momentumScore: 34, stage: 'EMERGING', totalHolders: 28000, totalVolume24h: 2100000, tokenCount: 5, whaleTrades: 0 },
  DEPIN: { momentumScore: 61, stage: 'HEATING', totalHolders: 94000, totalVolume24h: 8700000, tokenCount: 6, whaleTrades: 2 },
  POLITICAL: { momentumScore: 18, stage: 'COOLING', totalHolders: 31000, totalVolume24h: 800000, tokenCount: 4, whaleTrades: 0 },
  ANIMAL: { momentumScore: 44, stage: 'HEATING', totalHolders: 68000, totalVolume24h: 5200000, tokenCount: 9, whaleTrades: 1 },
  FINANCE: { momentumScore: 27, stage: 'EMERGING', totalHolders: 19000, totalVolume24h: 1400000, tokenCount: 3, whaleTrades: 0 },
  CULTURE: { momentumScore: 12, stage: 'DEAD', totalHolders: 4200, totalVolume24h: 200000, tokenCount: 2, whaleTrades: 0 },
};

const TOKEN_NAMES = {
  AI: ['GOAT', 'MINDAI', 'SYNTH', 'AGENT', 'BRAIN', 'ORACLE', 'LLM', 'PROMPT'],
  MEME: ['BONK', 'WIF', 'POPCAT', 'BOME', 'COPE', 'PEPE', 'CHAD', 'BASED', 'FROG', 'DOGE', 'SHIB', 'LOL', 'WAGMI', 'INU'],
  GAMING: ['QUEST', 'ARENA', 'PIXEL', 'REALM', 'GUILD'],
  DEPIN: ['NODE', 'MESH', 'GRID', 'POWER', 'INFRA', 'CHAINIO'],
  POLITICAL: ['MAGA', 'VOTE', 'LIBERTY', 'PATRIOT'],
  ANIMAL: ['WHALE', 'APE', 'TIGER', 'FOX', 'RABBIT', 'BEAR', 'BULL', 'CRAB', 'HAMSTER'],
  FINANCE: ['VAULT', 'YIELD', 'SWAP'],
  CULTURE: ['VIBE', 'HYPE'],
};

export { TOKEN_NAMES };

export function createMockNarratives() {
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(MOCK_BLUEPRINT).map(([id, cfg]) => {
      const def = NARRATIVES[id];
      const names = TOKEN_NAMES[id];
      const whaleTrades = Array.from({ length: cfg.whaleTrades }, (_, i) => ({
        txHash: mockAddress(`${id}-tx-${i}`),
        wallet: mockAddress(`${id}-wallet-${i}`),
        tokenAddress: mockAddress(`${id}-token-${i}`),
        volumeUsd: 54000 + seededNumber(`${id}-whale-${i}`, 420000),
        side: i % 3 === 0 ? 'sell' : 'buy',
        timestamp: now - (i + 1) * 540000,
      }));
      const tokens = names.slice(0, cfg.tokenCount).map((symbol, i) => {
        const holderShare = Math.max(210, Math.round((cfg.totalHolders / cfg.tokenCount) * (0.56 + seededNumber(`${symbol}-h`, 90) / 100)));
        const volumeShare = Math.max(12000, Math.round((cfg.totalVolume24h / cfg.tokenCount) * (0.52 + seededNumber(`${symbol}-v`, 120) / 100)));
        const buyPressure = 0.42 + seededNumber(`${symbol}-bp`, 38) / 100;
        return {
          address: mockAddress(`${id}-${symbol}`),
          symbol,
          name: `${symbol} ${def.name.split(' ')[0]}`,
          logoURI: '',
          volume24h: volumeShare,
          price: Number((0.00004 + seededNumber(`${symbol}-p`, 100000) / 10000000).toFixed(6)),
          priceChange24h: Number((-18 + seededNumber(`${symbol}-chg`, 62)).toFixed(1)),
          buyVolume: Math.round(volumeShare * buyPressure),
          sellVolume: Math.round(volumeShare * (1 - buyPressure)),
          buyPressure,
          holderCount: holderShare,
          securityRisk: seededNumber(`${symbol}-sec`, 10) > 7 ? 'MEDIUM' : 'LOW',
          sparkline: makeSparkline(symbol, 24, cfg.stage === 'COOLING' || cfg.stage === 'DEAD' ? -0.3 : 0.6),
          discoveredAt: now - seededNumber(`${symbol}-age`, 8 * 3600000),
          isNew: i < Math.max(1, Math.floor(cfg.tokenCount / 4)),
          whaleCount: whaleTrades.filter((_, wi) => wi % cfg.tokenCount === i).length,
        };
      });
      const totalBuy = tokens.reduce((s, t) => s + t.buyVolume, 0);
      const totalSell = tokens.reduce((s, t) => s + t.sellVolume, 0);
      return [
        id,
        {
          ...def,
          tokens,
          momentumScore: cfg.momentumScore,
          stage: cfg.stage,
          stageChangedAt: now - seededNumber(`${id}-stage`, 7200000),
          whaleTrades,
          totalVolume24h: cfg.totalVolume24h,
          totalHolders: cfg.totalHolders,
          totalBuyPressure: totalBuy / (totalBuy + totalSell + 1),
          newTokensLastHour: tokens.filter((t) => now - t.discoveredAt < 3600000).length,
          sparkline: makeSparkline(`${id}-score`, 12, cfg.stage === 'COOLING' || cfg.stage === 'DEAD' ? -0.25 : 0.5).map((v) => Math.min(100, Math.round(v))),
          smartWalletCount: Math.min(5, Math.max(1, cfg.whaleTrades)),
          lastUpdated: now - seededNumber(`${id}-updated`, 20000),
        },
      ];
    })
  );
}

export function createMockWallets() {
  return Array.from({ length: 10 }, (_, i) => ({
    wallet: mockAddress(`smart-${i}`),
    realizedPnl: (i % 2 ? 1 : -1) * (12000 + seededNumber(`pnl-${i}`, 88000)),
    winRate: 48 + seededNumber(`wr-${i}`, 41),
    totalTrades: 36 + seededNumber(`trades-${i}`, 340),
    narrativeIds: Object.keys(NARRATIVES)
      .filter((_, j) => (j + i) % 3 === 0)
      .slice(0, 3),
    lastActive: Date.now() - seededNumber(`active-${i}`, 3600000),
  }));
}

export function createMockEvents() {
  const ids = Object.keys(NARRATIVES);
  const types = ['WHALE_ENTRY', 'NEW_TOKEN', 'STAGE_CHANGE', 'ROTATION'];
  return Array.from({ length: 20 }, (_, i) => {
    const narrativeId = ids[i % ids.length];
    const nextId = ids[(i + 3) % ids.length];
    const type = types[i % types.length];
    const symbol = TOKEN_NAMES[narrativeId][i % TOKEN_NAMES[narrativeId].length];
    const amount = 52000 + seededNumber(`event-${i}`, 510000);
    const base = { id: `mock-${i}`, type, narrativeId, ts: Date.now() - i * 42000 };
    if (type === 'WHALE_ENTRY')
      return { ...base, title: 'WHALE ENTRY', main: `\u{1F40B} ${formatVolume(amount)} into ${NARRATIVES[narrativeId].name}`, sub: `${shortAddress(mockAddress(`ew-${i}`))} bought ${symbol}` };
    if (type === 'NEW_TOKEN')
      return { ...base, title: 'NEW TOKEN', main: `\u{1F331} ${symbol} launched in ${NARRATIVES[narrativeId].name}`, sub: `${shortAddress(mockAddress(`et-${i}`))} \u00B7 liquidity detected` };
    if (type === 'STAGE_CHANGE')
      return { ...base, title: 'STAGE CHANGE', main: `\u26A1 ${narrativeId}: EMERGING \u2192 ${MOCK_BLUEPRINT[narrativeId].stage}`, sub: `Momentum score ${MOCK_BLUEPRINT[narrativeId].momentumScore}` };
    return {
      ...base,
      title: 'ROTATION',
      main: `\u{1F4AB} Capital: ${nextId} \u2192 ${narrativeId}`,
      sub: `${formatVolume(amount * 2)} relative flow detected`,
      toNarrativeId: narrativeId,
      fromNarrativeId: nextId,
    };
  });
}

export function buildEmptyNarratives() {
  return Object.fromEntries(
    Object.entries(NARRATIVES).map(([id, def]) => [
      id,
      {
        ...def,
        tokens: [],
        momentumScore: 0,
        stage: 'DEAD',
        stageChangedAt: Date.now(),
        whaleTrades: [],
        totalVolume24h: 0,
        totalHolders: 0,
        totalBuyPressure: 0,
        newTokensLastHour: 0,
        sparkline: [],
        smartWalletCount: 0,
        lastUpdated: Date.now(),
      },
    ])
  );
}
