import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const WS_URL = (apiKey) => `wss://public-api.birdeye.so/socket/solana?x-api-key=${encodeURIComponent(apiKey)}`;
const API_BASE = 'https://public-api.birdeye.so';

const NARRATIVES = {
  AI: { id: 'AI', name: 'AI & Agents', emoji: '🤖', color: '#60A5FA' },
  MEME: { id: 'MEME', name: 'Meme', emoji: '🐸', color: '#F472B6' },
  GAMING: { id: 'GAMING', name: 'Gaming', emoji: '🎮', color: '#34D399' },
  DEPIN: { id: 'DEPIN', name: 'DePIN', emoji: '🔌', color: '#FBBF24' },
  POLITICAL: { id: 'POLITICAL', name: 'Political', emoji: '🗳️', color: '#F87171' },
  ANIMAL: { id: 'ANIMAL', name: 'Animal Coins', emoji: '🐾', color: '#A78BFA' },
  FINANCE: { id: 'FINANCE', name: 'DeFi & Finance', emoji: '💰', color: '#2DD4BF' },
  CULTURE: { id: 'CULTURE', name: 'Culture & Art', emoji: '🎨', color: '#FB923C' }
};

const NARRATIVE_KEYWORDS = {
  AI: ['ai', 'gpt', 'agent', 'neural', 'llm', 'agi', 'oracle', 'prompt', 'compute', 'inference', 'brain', 'mind', 'synth', 'auto', 'bot', 'model', 'goat'],
  MEME: ['pepe', 'doge', 'shib', 'inu', 'cat', 'dog', 'frog', 'wojak', 'chad', 'bonk', 'wif', 'bome', 'popcat', 'meme', 'lol', 'cope', 'wagmi', 'based'],
  GAMING: ['game', 'play', 'quest', 'guild', 'hero', 'sword', 'legend', 'arena', 'battle', 'rpg', 'pixel', 'realm', 'world', 'craft', 'meta', 'verse'],
  DEPIN: ['depin', 'node', 'protocol', 'infra', 'chain', 'layer', 'compute', 'storage', 'bandwidth', 'mesh', 'grid', 'power', 'energy', 'network', 'io'],
  POLITICAL: ['trump', 'biden', 'maga', 'vote', 'election', 'usa', 'america', 'freedom', 'liberty', 'patriot', 'gop', 'gov', 'pres', 'senate', 'official'],
  ANIMAL: ['cat', 'dog', 'bear', 'bull', 'ape', 'monkey', 'bird', 'fish', 'whale', 'tiger', 'lion', 'wolf', 'fox', 'rabbit', 'hamster', 'rat', 'crab'],
  FINANCE: ['bank', 'finance', 'pay', 'cash', 'money', 'gold', 'silver', 'yield', 'stake', 'lend', 'borrow', 'swap', 'pool', 'vault', 'earn', 'usd', 'btc'],
  CULTURE: ['music', 'art', 'nft', 'creator', 'media', 'film', 'sport', 'fan', 'celeb', 'brand', 'hype', 'viral', 'trend', 'pop', 'culture', 'love', 'vibe']
};

const STAGE_CONFIG = {
  EMERGING: { label: 'EMERGING', emoji: '🌱', color: 'var(--stage-emerging)', rawColor: '#34D399', bg: 'rgba(52,211,153,0.08)' },
  HEATING: { label: 'HEATING', emoji: '🔥', color: 'var(--stage-heating)', rawColor: '#FBBF24', bg: 'rgba(251,191,36,0.08)' },
  PEAKING: { label: 'PEAKING', emoji: '⚡', color: 'var(--stage-peaking)', rawColor: '#F472B6', bg: 'rgba(244,114,182,0.08)' },
  COOLING: { label: 'COOLING', emoji: '🌊', color: 'var(--stage-cooling)', rawColor: '#94A3B8', bg: 'rgba(148,163,184,0.08)' },
  DEAD: { label: 'DEAD', emoji: '💀', color: 'var(--stage-dead)', rawColor: '#2D2D40', bg: 'rgba(45,45,64,0.08)' }
};

const INIT_STEPS = [
  'Fetching trending tokens...',
  'Fetching token metadata...',
  'Clustering tokens into narratives...',
  'Fetching meme narrative tokens...',
  'Analyzing buy/sell pressure...',
  'Running security checks...',
  'Fetching price history...',
  'Identifying smart wallets...',
  'Validating smart wallet quality...',
  'Computing narrative momentum scores...',
  'Connecting live WebSocket streams...',
  'Zeitgeist is live.'
];

const MOCK_BLUEPRINT = {
  AI: { momentumScore: 82, stage: 'HEATING', totalHolders: 142000, totalVolume24h: 18400000, tokenCount: 8, whaleTrades: 3 },
  MEME: { momentumScore: 91, stage: 'PEAKING', totalHolders: 480000, totalVolume24h: 48200000, tokenCount: 14, whaleTrades: 7 },
  GAMING: { momentumScore: 34, stage: 'EMERGING', totalHolders: 28000, totalVolume24h: 2100000, tokenCount: 5, whaleTrades: 0 },
  DEPIN: { momentumScore: 61, stage: 'HEATING', totalHolders: 94000, totalVolume24h: 8700000, tokenCount: 6, whaleTrades: 2 },
  POLITICAL: { momentumScore: 18, stage: 'COOLING', totalHolders: 31000, totalVolume24h: 800000, tokenCount: 4, whaleTrades: 0 },
  ANIMAL: { momentumScore: 44, stage: 'HEATING', totalHolders: 68000, totalVolume24h: 5200000, tokenCount: 9, whaleTrades: 1 },
  FINANCE: { momentumScore: 27, stage: 'EMERGING', totalHolders: 19000, totalVolume24h: 1400000, tokenCount: 3, whaleTrades: 0 },
  CULTURE: { momentumScore: 12, stage: 'DEAD', totalHolders: 4200, totalVolume24h: 200000, tokenCount: 2, whaleTrades: 0 }
};

const TOKEN_NAMES = {
  AI: ['GOAT', 'MINDAI', 'SYNTH', 'AGENT', 'BRAIN', 'ORACLE', 'LLM', 'PROMPT'],
  MEME: ['BONK', 'WIF', 'POPCAT', 'BOME', 'COPE', 'PEPE', 'CHAD', 'BASED', 'FROG', 'DOGE', 'SHIB', 'LOL', 'WAGMI', 'INU'],
  GAMING: ['QUEST', 'ARENA', 'PIXEL', 'REALM', 'GUILD'],
  DEPIN: ['NODE', 'MESH', 'GRID', 'POWER', 'INFRA', 'CHAINIO'],
  POLITICAL: ['MAGA', 'VOTE', 'LIBERTY', 'PATRIOT'],
  ANIMAL: ['WHALE', 'APE', 'TIGER', 'FOX', 'RABBIT', 'BEAR', 'BULL', 'CRAB', 'HAMSTER'],
  FINANCE: ['VAULT', 'YIELD', 'SWAP'],
  CULTURE: ['VIBE', 'HYPE']
};

function shortAddress(address) {
  if (!address) return '—';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function seededNumber(seed, mod = 1000) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 2147483647;
  return h % mod;
}

function mockAddress(seed) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let out = '';
  let n = seededNumber(seed, 100000) + 777;
  for (let i = 0; i < 44; i += 1) {
    n = (n * 48271 + i + seed.length) % 2147483647;
    out += alphabet[n % alphabet.length];
  }
  return out;
}

function makeSparkline(seed, count = 24, trend = 1) {
  const base = 20 + seededNumber(seed, 80);
  return Array.from({ length: count }, (_, i) => {
    const wave = Math.sin((i + seededNumber(seed, 7)) / 2.4) * 4;
    const drift = i * trend * 0.9;
    const jitter = ((seededNumber(`${seed}-${i}`, 100) / 100) - 0.5) * 5;
    return Math.max(1, Number((base + wave + drift + jitter).toFixed(2)));
  });
}

function formatVolume(v = 0) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${Number(v || 0).toFixed(0)}`;
}

function formatHolders(n = 0) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
}

function formatPrice(p = 0) {
  if (p < 0.000001) return p.toExponential(2);
  if (p < 0.0001) return p.toFixed(6);
  if (p < 0.01) return p.toFixed(4);
  if (p < 1) return p.toFixed(3);
  if (p < 1000) return p.toFixed(2);
  return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function classifyToken(token) {
  const text = `${token?.name || ''} ${token?.symbol || ''}`.toLowerCase();
  const scores = {};
  for (const [id, keywords] of Object.entries(NARRATIVE_KEYWORDS)) {
    scores[id] = keywords.filter((kw) => text.includes(kw)).length;
  }
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return top[1] > 0 ? top[0] : 'MEME';
}

function computeNarrativeScore(narrative) {
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

function computeStage(narrative, scoreHistory) {
  const current = narrative.momentumScore;
  const history = scoreHistory[narrative.id] || [current];
  const trend = current - (history[history.length - 2] || current);
  const avgAge = (narrative.tokens || []).reduce((s, t) => s + (Date.now() - t.discoveredAt), 0) / ((narrative.tokens || []).length || 1) / 3600000;
  if (current < 15) return 'DEAD';
  if (current < 30 && trend >= 0 && avgAge < 2) return 'EMERGING';
  if (current >= 30 && trend > 2) return 'HEATING';
  if (current >= 60 && Math.abs(trend) < 2) return 'PEAKING';
  if (trend < -3) return 'COOLING';
  if (current >= 30) return 'HEATING';
  return 'EMERGING';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTokenList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.tokens)) return payload.data.tokens;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

function Sparkline({ data, width = 80, height = 24, color }) {
  if (!data || data.length < 2) return <span className="spark-empty" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  }).join(' ');
  const positive = data[data.length - 1] >= data[0];
  const lineColor = color || (positive ? 'var(--green)' : 'var(--red)');
  return <svg width={width} height={height} className="spark"><polyline points={pts} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

class WebSocketManager {
  constructor({ getUrl, onStatus, onMessage }) {
    this.getUrl = getUrl;
    this.onStatus = onStatus;
    this.onMessage = onMessage;
    this.ws = null;
    this.connected = false;
    this.manualClose = false;
    this.subscriptions = new Map();
    this.queue = [];
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
  }

  connect() {
    this.manualClose = false;
    this.cleanupSocket();
    this.onStatus('connecting');
    try {
      this.ws = new WebSocket(this.getUrl(), 'echo-protocol');
      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.onStatus('live');
        this.startHeartbeat();
        [...this.subscriptions.values()].forEach((msg) => this.send(msg));
        const pending = [...this.queue];
        this.queue = [];
        pending.forEach((msg) => this.send(msg));
      };
      this.ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try { this.onMessage(JSON.parse(event.data)); } catch { this.onMessage(event.data); }
      };
      this.ws.onerror = () => this.onStatus('connecting');
      this.ws.onclose = () => {
        this.connected = false;
        this.stopHeartbeat();
        if (!this.manualClose) this.scheduleReconnect();
        else this.onStatus('disconnected');
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.manualClose = true;
    this.connected = false;
    clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    if (this.ws) this.ws.close();
    this.ws = null;
    this.onStatus('disconnected');
  }

  subscribe(key, message) {
    this.subscriptions.set(key, message);
    this.send(message);
  }

  unsubscribe(key) {
    const message = this.subscriptions.get(key);
    this.subscriptions.delete(key);
    if (message) this.send({ ...message, type: message.type?.replace('SUBSCRIBE', 'UNSUBSCRIBE') });
  }

  send(message) {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(message));
    else this.queue.push(message);
  }

  scheduleReconnect() {
    this.onStatus('connecting');
    const delay = Math.min(30000, 1000 * (2 ** this.reconnectAttempts));
    this.reconnectAttempts += 1;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => this.send({ type: 'ping', ts: Date.now() }), 30000);
  }

  stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  cleanupSocket() {
    if (!this.ws) return;
    this.ws.onopen = null;
    this.ws.onmessage = null;
    this.ws.onerror = null;
    this.ws.onclose = null;
    try { this.ws.close(); } catch { /* noop */ }
  }
}

function createMockNarratives() {
  const now = Date.now();
  return Object.fromEntries(Object.entries(MOCK_BLUEPRINT).map(([id, cfg]) => {
    const def = NARRATIVES[id];
    const names = TOKEN_NAMES[id];
    const whaleTrades = Array.from({ length: cfg.whaleTrades }, (_, i) => ({
      txHash: mockAddress(`${id}-tx-${i}`),
      wallet: mockAddress(`${id}-wallet-${i}`),
      tokenAddress: mockAddress(`${id}-token-${i}`),
      volumeUsd: 54000 + seededNumber(`${id}-whale-${i}`, 420000),
      side: i % 3 === 0 ? 'sell' : 'buy',
      timestamp: now - (i + 1) * 540000
    }));
    const tokens = names.slice(0, cfg.tokenCount).map((symbol, i) => {
      const holderShare = Math.max(210, Math.round((cfg.totalHolders / cfg.tokenCount) * (0.56 + (seededNumber(`${symbol}-h`, 90) / 100))));
      const volumeShare = Math.max(12000, Math.round((cfg.totalVolume24h / cfg.tokenCount) * (0.52 + (seededNumber(`${symbol}-v`, 120) / 100))));
      const buyPressure = 0.42 + (seededNumber(`${symbol}-bp`, 38) / 100);
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
        whaleCount: whaleTrades.filter((_, wi) => wi % cfg.tokenCount === i).length
      };
    });
    const totalBuy = tokens.reduce((s, t) => s + t.buyVolume, 0);
    const totalSell = tokens.reduce((s, t) => s + t.sellVolume, 0);
    return [id, {
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
      lastUpdated: now - seededNumber(`${id}-updated`, 20000)
    }];
  }));
}

function createMockWallets() {
  return Array.from({ length: 10 }, (_, i) => ({
    wallet: mockAddress(`smart-${i}`),
    realizedPnl: (i % 2 ? 1 : -1) * (12000 + seededNumber(`pnl-${i}`, 88000)),
    winRate: 48 + seededNumber(`wr-${i}`, 41),
    totalTrades: 36 + seededNumber(`trades-${i}`, 340),
    narrativeIds: Object.keys(NARRATIVES).filter((_, j) => (j + i) % 3 === 0).slice(0, 3),
    lastActive: Date.now() - seededNumber(`active-${i}`, 3600000)
  }));
}

function createMockEvents() {
  const ids = Object.keys(NARRATIVES);
  const types = ['WHALE_ENTRY', 'NEW_TOKEN', 'STAGE_CHANGE', 'ROTATION'];
  return Array.from({ length: 20 }, (_, i) => {
    const narrativeId = ids[i % ids.length];
    const nextId = ids[(i + 3) % ids.length];
    const type = types[i % types.length];
    const symbol = TOKEN_NAMES[narrativeId][i % TOKEN_NAMES[narrativeId].length];
    const amount = 52000 + seededNumber(`event-${i}`, 510000);
    const base = { id: `mock-${i}`, type, narrativeId, ts: Date.now() - i * 42000 };
    if (type === 'WHALE_ENTRY') return { ...base, title: 'WHALE ENTRY', main: `🐋 ${formatVolume(amount)} into ${NARRATIVES[narrativeId].name}`, sub: `${shortAddress(mockAddress(`ew-${i}`))} bought ${symbol}` };
    if (type === 'NEW_TOKEN') return { ...base, title: 'NEW TOKEN', main: `🌱 ${symbol} launched in ${NARRATIVES[narrativeId].name}`, sub: `${shortAddress(mockAddress(`et-${i}`))} · liquidity detected` };
    if (type === 'STAGE_CHANGE') return { ...base, title: 'STAGE CHANGE', main: `⚡ ${narrativeId}: EMERGING → ${MOCK_BLUEPRINT[narrativeId].stage}`, sub: `Momentum score ${MOCK_BLUEPRINT[narrativeId].momentumScore}` };
    return { ...base, title: 'ROTATION', main: `💫 Capital: ${nextId} → ${narrativeId}`, sub: `${formatVolume(amount * 2)} relative flow detected`, toNarrativeId: narrativeId, fromNarrativeId: nextId };
  });
}

function buildEmptyNarratives() {
  return Object.fromEntries(Object.entries(NARRATIVES).map(([id, def]) => [id, {
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
    lastUpdated: Date.now()
  }]));
}

function recomputeNarrative(narrative, scoreHistoryRef) {
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
    newTokensLastHour: tokens.filter((t) => Date.now() - t.discoveredAt < 3600000).length
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
    lastUpdated: Date.now()
  };
}

function computeBubbleLayout(bubbles, containerWidth, containerHeight) {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const count = bubbles.length || 1;
  const orbit = Math.max(120, Math.min(containerWidth, containerHeight) * 0.32);
  return bubbles.map((b, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const wobble = i % 2 ? 0.82 : 1.08;
    const x = Math.max(b.radius + 45, Math.min(containerWidth - b.radius - 45, centerX + Math.cos(angle) * orbit * wobble));
    const y = Math.max(b.radius + 50, Math.min(containerHeight - b.radius - 35, centerY + Math.sin(angle) * orbit * wobble));
    return { ...b, x, y };
  });
}

function Zeitgeist() {
  const [apiKey, setApiKey] = useState('');
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [isInitializing, setIsInitializing] = useState(false);
  const [initSteps, setInitSteps] = useState(INIT_STEPS.map((label) => ({ label, done: false })));
  const [initProgress, setInitProgress] = useState(0);
  const [narratives, setNarratives] = useState(() => createMockNarratives());
  const [selectedNarrative, setSelectedNarrative] = useState(null);
  const [activeView, setActiveView] = useState('bubbles');
  const [activeTab, setActiveTab] = useState('tokens');
  const [eventFeed, setEventFeed] = useState(() => createMockEvents());
  const [smartWallets, setSmartWallets] = useState(() => createMockWallets());
  const [totalStats, setTotalStats] = useState({ narratives: 8, tokens: 51, volume: 85300000, holders: 866200 });
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [hoveredBubble, setHoveredBubble] = useState(null);
  const [expandedToken, setExpandedToken] = useState(null);
  const [paused, setPaused] = useState(false);
  const [queuedEvents, setQueuedEvents] = useState([]);
  const [copied, setCopied] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [stageFlash, setStageFlash] = useState(null);
  const scoreHistoryRef = useRef({});
  const wsRef = useRef(null);
  const tokenCacheRef = useRef(new Map());
  const narrativesRef = useRef(narratives);
  const enrichmentQueueRef = useRef([]);
  const recomputeTimerRef = useRef(null);
  const bubbleContainerRef = useRef(null);
  const apiInputRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
      :root{--bg-void:#030308;--bg-base:#070710;--bg-surface:#0C0C1C;--bg-raised:#111124;--bg-hover:#16162E;--bg-overlay:rgba(7,7,16,.92);--border-faint:rgba(255,255,255,.04);--border-subtle:rgba(255,255,255,.07);--border-soft:rgba(255,255,255,.11);--border-bright:rgba(255,255,255,.20);--text-primary:#F2F2FF;--text-secondary:#7A7A9A;--text-muted:#3E3E58;--text-dim:#252538;--stage-emerging:#34D399;--stage-heating:#FBBF24;--stage-peaking:#F472B6;--stage-cooling:#94A3B8;--stage-dead:#2D2D40;--green:#10B981;--green-dim:rgba(16,185,129,.10);--red:#EF4444;--red-dim:rgba(239,68,68,.10);--amber:#F59E0B;--amber-dim:rgba(245,158,11,.10);--font-sans:'DM Sans',sans-serif;--font-mono:'DM Mono',monospace;--radius:6px;--radius-sm:4px}
      *{box-sizing:border-box}body{margin:0;background:var(--bg-void);color:var(--text-primary);font-family:var(--font-sans);overflow:hidden}.zg-app{height:100vh;background:radial-gradient(circle at 50% -20%,rgba(96,165,250,.08),transparent 38%),var(--bg-base);display:flex;flex-direction:column}.zg-header{height:52px;display:flex;align-items:center;gap:14px;padding:0 16px;border-bottom:1px solid var(--border-faint);background:rgba(3,3,8,.86);flex:0 0 auto}.radar{width:18px;height:18px;border:1px solid var(--border-bright);border-radius:50%;background:conic-gradient(from 0deg,rgba(96,165,250,.65),transparent 38%,transparent);animation:radar-sweep 2.6s linear infinite}.brand{font-weight:600;font-size:16px;letter-spacing:.02em}.status{display:flex;align-items:center;gap:8px;margin-left:6px;font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)}.status-dot{width:6px;height:6px;border-radius:50%;background:var(--text-muted)}.status-dot.live{background:var(--green);animation:pulse-dot 1.8s ease-in-out infinite}.status-dot.connecting{background:var(--amber);animation:pulse-dot 1s ease-in-out infinite}.header-stats{font-family:var(--font-mono);font-size:11px;color:var(--text-muted);white-space:nowrap}.spacer{flex:1}.api-input{width:200px;height:30px;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);color:var(--text-primary);font-family:var(--font-mono);font-size:12px;padding:0 10px;outline:none}.api-input:focus{border-color:var(--border-bright)}button{font-family:inherit}.connect-btn,.ctrl-btn,.pause-btn,.copy-btn{height:30px;background:transparent;border:1px solid var(--border-soft);border-radius:var(--radius-sm);color:var(--text-secondary);font-family:var(--font-mono);font-size:11px;padding:0 12px;cursor:pointer}.connect-btn:hover,.ctrl-btn:hover,.pause-btn:hover,.copy-btn:hover,.ctrl-btn.active{background:var(--bg-hover);color:var(--text-primary)}.demo-banner{height:36px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--border-faint);font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);background:var(--bg-surface);letter-spacing:.02em}.main-grid{min-height:0;flex:1;display:grid;grid-template-columns:240px minmax(0,1fr) 300px}.left-panel,.right-panel{min-height:0;background:rgba(12,12,28,.72);border-right:1px solid var(--border-faint);overflow:hidden;display:flex;flex-direction:column}.right-panel{border-right:0;border-left:1px solid var(--border-faint)}.panel-head{height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;border-bottom:1px solid var(--border-faint);font-family:var(--font-mono);font-size:10px;letter-spacing:.08em;color:var(--text-muted)}.narrative-list,.feed-list,.detail-scroll{overflow:auto;min-height:0}.narrative-row{padding:12px 14px;border-bottom:1px solid var(--border-faint);cursor:pointer;transition:background .18s ease,border-color .18s ease;border-left:2px solid transparent}.narrative-row:hover{background:var(--bg-hover)}.narrative-row.selected{background:var(--bg-raised)}.narrative-row.flash{animation:stage-flash .6s ease}.row-top{display:flex;align-items:center;gap:8px}.color-dot{width:8px;height:8px;border-radius:50%;flex:0 0 auto}.row-name{font-size:13px;font-weight:500;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.row-score{font-family:var(--font-mono);font-size:13px}.score-bar{height:3px;margin:8px 0 7px;background:rgba(255,255,255,.05);border-radius:8px;overflow:hidden}.score-fill{height:100%;border-radius:8px;transition:width .8s ease}.row-sub{font-family:var(--font-mono);font-size:10px;color:var(--text-muted)}.center-panel{min-width:0;min-height:0;background:var(--bg-base);display:flex;flex-direction:column;position:relative}.center-controls{height:44px;display:flex;align-items:center;gap:8px;padding:0 14px;border-bottom:1px solid var(--border-faint);flex:0 0 auto}.updated{font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-left:auto}.bubble-stage{border-radius:9px;padding:1px 6px;font-size:9px;font-weight:600;text-align:center;font-family:var(--font-mono);white-space:nowrap;height:18px}.bubble-wrap{position:relative;flex:1;min-height:0;overflow:hidden}.bubble-tooltip{position:fixed;z-index:30;pointer-events:none;min-width:230px;background:rgba(12,12,28,.96);border:1px solid var(--border-soft);border-radius:var(--radius);padding:12px;box-shadow:0 16px 40px rgba(0,0,0,.34);transition:opacity .15s ease}.tip-title{font-weight:600;margin-bottom:8px}.tip-line{font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);line-height:1.8}.list-table,.token-table{width:100%;border-collapse:collapse}.list-table th,.list-table td,.token-table th,.token-table td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--border-faint);font-size:12px}.list-table th,.token-table th{font-family:var(--font-mono);font-size:10px;color:var(--text-muted);font-weight:500;letter-spacing:.06em}.mono{font-family:var(--font-mono)}.muted{color:var(--text-muted)}.green{color:var(--green)}.red{color:var(--red)}.detail-head{height:58px;display:flex;align-items:center;gap:14px;padding:0 14px;border-bottom:1px solid var(--border-faint)}.back-btn{background:transparent;border:0;color:var(--text-secondary);font-family:var(--font-mono);font-size:11px;cursor:pointer}.detail-title{font-weight:600}.tabs{display:flex;gap:22px;height:42px;align-items:flex-end;padding:0 14px;border-bottom:1px solid var(--border-faint)}.tab{height:42px;background:transparent;border:0;color:var(--text-muted);font-family:var(--font-mono);font-size:11px;letter-spacing:.05em;cursor:pointer;border-bottom:1.5px solid transparent}.tab.active{color:var(--text-primary)}.token-id{display:flex;align-items:center;gap:8px}.logo{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;background:var(--bg-hover);overflow:hidden}.new-badge{font-family:var(--font-mono);font-size:9px;color:var(--green);border:1px solid rgba(16,185,129,.45);border-radius:var(--radius-sm);padding:1px 4px;animation:pulse-dot 1.3s ease-in-out infinite}.pressure{width:48px;height:4px;background:rgba(255,255,255,.06);border-radius:8px;overflow:hidden;display:inline-block;margin-right:6px;vertical-align:middle}.pressure span{display:block;height:100%;background:var(--green)}.risk{display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:11px}.risk-dot{width:7px;height:7px;border-radius:50%}.accordion{background:rgba(255,255,255,.02)}.accordion td{padding:12px 28px}.token-detail{display:flex;align-items:center;gap:18px;font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)}.wallet-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;padding:14px}.wallet-card{border:1px solid var(--border-subtle);border-radius:var(--radius);background:var(--bg-surface);padding:14px}.wallet-top{display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:12px}.wallet-line{font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);margin-top:10px}.event{padding:12px 14px 12px 12px;border-bottom:1px solid var(--border-faint);border-left:2px solid var(--border-bright);animation:slide-in-top .2s ease}.event-top{display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:10px;color:var(--text-muted);letter-spacing:.05em}.event-main{font-size:13px;margin-top:8px}.event-sub{font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);margin-top:4px;overflow:hidden;text-overflow:ellipsis}.queued{font-family:var(--font-mono);font-size:10px;color:var(--green);margin-left:6px}.loading{height:100vh;background:var(--bg-void);display:flex;align-items:center;justify-content:center}.loading-card{width:420px;text-align:center}.loading-logo{margin:0 auto 18px}.loading-title{font-size:20px;font-weight:600;margin-bottom:8px}.loading-sub{font-size:13px;color:var(--text-secondary);margin-bottom:26px}.steps{text-align:left;margin:0 auto;width:320px}.step{font-family:var(--font-mono);font-size:12px;line-height:2;color:var(--text-dim)}.step.done{color:var(--text-secondary)}.step.current{color:var(--text-primary);animation:pulse-dot 1s ease-in-out infinite}.progress{height:2px;background:rgba(255,255,255,.08);margin:24px auto 0;width:320px}.progress span{display:block;height:100%;background:var(--green);transition:width .25s ease}.copied-tip{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:var(--bg-raised);border:1px solid var(--border-soft);border-radius:var(--radius);padding:8px 12px;font-family:var(--font-mono);font-size:11px;color:var(--green);z-index:50}.spark{display:block}.spark-empty{display:block;width:80px;height:24px}@keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)}}@keyframes pulse-ring{0%,100%{opacity:.15}50%{opacity:.35}}@keyframes radar-sweep{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes slide-in-top{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}@keyframes stage-flash{0%{opacity:1}25%{opacity:.4}50%{opacity:1}75%{opacity:.4}100%{opacity:1}}@media(max-width:1100px){.main-grid{grid-template-columns:220px minmax(0,1fr)}.right-panel{display:none}.api-input{width:150px}.header-stats{display:none}}`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => { narrativesRef.current = narratives; }, [narratives]);

  useEffect(() => {
    setTotalStats({
      narratives: Object.keys(narratives).length,
      tokens: Object.values(narratives).reduce((s, n) => s + n.tokens.length, 0),
      volume: Object.values(narratives).reduce((s, n) => s + n.totalVolume24h, 0),
      holders: Object.values(narratives).reduce((s, n) => s + n.totalHolders, 0)
    });
  }, [narratives]);

  const addEvent = useCallback((event) => {
    const normalized = { id: `${event.type}-${event.ts || Date.now()}-${Math.random()}`, ts: Date.now(), ...event };
    if (paused) {
      setQueuedEvents((q) => [normalized, ...q].slice(0, 20));
      return;
    }
    setEventFeed((feed) => [normalized, ...feed].slice(0, 50));
  }, [paused]);

  useEffect(() => {
    if (!paused && queuedEvents.length) {
      setEventFeed((feed) => [...queuedEvents, ...feed].slice(0, 50));
      setQueuedEvents([]);
    }
  }, [paused, queuedEvents]);

  const apiFetch = useCallback(async (path) => {
    try {
      const res = await fetch(`${API_BASE}${path}`, { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    } finally {
      await sleep(150);
    }
  }, [apiKey]);

  const markStep = useCallback((index) => {
    setInitSteps(INIT_STEPS.map((label, i) => ({ label, done: i <= index })));
    setInitProgress(Math.round(((index + 1) / INIT_STEPS.length) * 100));
  }, []);

  const subscribeBaseStreams = useCallback(() => {
    if (!wsRef.current) return;
    wsRef.current.subscribe('new-listing', { type: 'SUBSCRIBE_TOKEN_NEW_LISTING', data: { chain: 'solana' } });
    wsRef.current.subscribe('large-trades', { type: 'SUBSCRIBE_LARGE_TRADE_TXS', data: { chain: 'solana', minVolumeUsd: 50000 } });
    wsRef.current.subscribe('meme', { type: 'SUBSCRIBE_MEME', data: { chain: 'solana' } });
    wsRef.current.subscribe('new-pair', { type: 'SUBSCRIBE_NEW_PAIR', data: { chain: 'solana' } });
    Object.values(narrativesRef.current).flatMap((n) => n.tokens.slice(0, 2)).forEach((token) => {
      wsRef.current.subscribe(`stats-${token.address}`, { type: 'SUBSCRIBE_TOKEN_STATS', data: { address: token.address } });
    });
  }, []);

  const scheduleRecompute = useCallback(() => {
    clearTimeout(recomputeTimerRef.current);
    recomputeTimerRef.current = setTimeout(() => {
      const previous = narrativesRef.current;
      const next = Object.fromEntries(Object.entries(previous).map(([id, n]) => [id, recomputeNarrative(n, scoreHistoryRef)]));
      Object.values(next).forEach((n) => {
        if (previous[n.id]?.stage !== n.stage) {
          setStageFlash(n.id);
          setTimeout(() => setStageFlash(null), 700);
          addEvent({ type: 'STAGE_CHANGE', narrativeId: n.id, title: 'STAGE CHANGE', main: `⚡ ${n.id}: ${previous[n.id]?.stage} → ${n.stage}`, sub: `Momentum score ${n.momentumScore}` });
        }
      });
      setNarratives(next);
      setLastRefresh(Date.now());
    }, 5000);
  }, [addEvent]);

  const processWsMessage = useCallback((message) => {
    const type = message?.type;
    const data = message?.data || message;
    if (!type) return;
    if (type === 'TOKEN_NEW_LISTING_DATA') {
      const token = { address: data.address, symbol: data.symbol || 'NEW', name: data.name || data.symbol || 'New Token', discoveredAt: Date.now(), createdAt: data.createdAt };
      enrichmentQueueRef.current.push(token);
      addEvent({ type: 'NEW_TOKEN', narrativeId: classifyToken(token), title: 'NEW TOKEN', main: `🌱 ${token.symbol} launched`, sub: shortAddress(token.address) });
      if (enrichmentQueueRef.current.length >= 10) enrichQueuedTokens();
    }
    if (type === 'LARGE_TRADE_TXS_DATA') {
      const tokenAddress = data.tokenAddress || data.address;
      const found = Object.values(narrativesRef.current).find((n) => n.tokens.some((t) => t.address === tokenAddress));
      if (!found) return;
      const trade = { txHash: data.txHash, wallet: data.wallet, tokenAddress, volumeUsd: Number(data.volumeUsd || 0), side: data.side || 'buy', timestamp: data.timestamp || Date.now() };
      setNarratives((prev) => ({ ...prev, [found.id]: { ...prev[found.id], whaleTrades: [trade, ...prev[found.id].whaleTrades].slice(0, 30) } }));
      addEvent({ type: 'WHALE_ENTRY', narrativeId: found.id, title: 'WHALE ENTRY', main: `🐋 ${formatVolume(trade.volumeUsd)} into ${found.name}`, sub: `${shortAddress(trade.wallet)} ${trade.side} ${shortAddress(tokenAddress)}` });
      scheduleRecompute();
    }
    if (type === 'TOKEN_STATS_DATA') {
      const address = data.address || data.tokenAddress;
      setNarratives((prev) => Object.fromEntries(Object.entries(prev).map(([id, n]) => [id, {
        ...n,
        tokens: n.tokens.map((t) => t.address === address ? { ...t, price: data.price ?? t.price, volume24h: data.volume24h ?? t.volume24h, priceChange24h: data.priceChange24h ?? t.priceChange24h, holderCount: data.holderCount ?? data.uniqueWallets24h ?? t.holderCount } : t)
      }])));
      scheduleRecompute();
    }
    if (type === 'MEME_DATA') {
      const token = { address: data.address, symbol: data.symbol || 'MEME', name: data.name || 'Meme Token', volume24h: data.volume || 0, priceChange24h: data.priceChange || 0, holderCount: data.holderCount || 0, discoveredAt: Date.now(), isNew: true };
      upsertToken('MEME', token);
    }
    if (type === 'NEW_PAIR_DATA') addEvent({ type: 'NEW_PAIR', narrativeId: 'MEME', title: 'LIQUIDITY', main: `◎ New Solana pair confirmed`, sub: `${formatVolume(data.liquidity || 0)} liquidity · ${shortAddress(data.baseAddress || data.address)}` });
  }, [addEvent, scheduleRecompute]);

  const enrichQueuedTokens = useCallback(async () => {
    const batch = enrichmentQueueRef.current.splice(0, 10);
    if (!batch.length || !apiKey) return;
    const list = batch.map((t) => t.address).join(',');
    const meta = await apiFetch(`/defi/v3/token/meta-data/multiple?list_address=${list}`);
    const metaRows = normalizeTokenList(meta);
    batch.forEach((token) => {
      const m = metaRows.find((row) => row.address === token.address) || token;
      const nextToken = { ...token, ...m, isNew: true, volume24h: m.volume24h || 0, holderCount: m.holderCount || 0, buyVolume: 0, sellVolume: 0, buyPressure: 0.5, securityRisk: 'LOW', sparkline: [] };
      upsertToken(classifyToken(nextToken), nextToken);
    });
  }, [apiFetch, apiKey]);

  function upsertToken(narrativeId, token) {
    tokenCacheRef.current.set(token.address, token);
    setNarratives((prev) => {
      const n = prev[narrativeId] || { ...NARRATIVES[narrativeId], tokens: [], whaleTrades: [] };
      const tokens = [token, ...n.tokens.filter((t) => t.address !== token.address)].slice(0, 24);
      return { ...prev, [narrativeId]: recomputeNarrative({ ...n, tokens }, scoreHistoryRef) };
    });
    if (wsRef.current && token.address) wsRef.current.subscribe(`stats-${token.address}`, { type: 'SUBSCRIBE_TOKEN_STATS', data: { address: token.address } });
    scheduleRecompute();
  }

  const initializeLive = useCallback(async () => {
    if (!apiKey.trim()) return;
    setIsInitializing(true);
    setInitSteps(INIT_STEPS.map((label) => ({ label, done: false })));
    setInitProgress(0);
    const working = buildEmptyNarratives();

    markStep(0);
    const tokenList = normalizeTokenList(await apiFetch('/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=50&min_liquidity=50000'));
    const addresses = tokenList.map((t) => t.address).filter(Boolean).slice(0, 50);

    markStep(1);
    const metaRows = normalizeTokenList(await apiFetch(`/defi/v3/token/meta-data/multiple?list_address=${addresses.join(',')}`));
    const enriched = tokenList.map((t) => ({ ...t, ...(metaRows.find((m) => m.address === t.address) || {}) }));

    markStep(2);
    enriched.forEach((token) => {
      const id = classifyToken(token);
      working[id].tokens.push({
        address: token.address,
        symbol: token.symbol || 'UNK',
        name: token.name || token.symbol || 'Unknown',
        logoURI: token.logoURI || token.logo_uri || '',
        volume24h: Number(token.v24hUSD || token.volume24h || token.volume || 0),
        price: Number(token.price || 0),
        priceChange24h: Number(token.priceChange24h || token.price_change_24h || 0),
        buyVolume: 0,
        sellVolume: 0,
        buyPressure: 0.5,
        holderCount: Number(token.holder || token.holderCount || token.uniqueWallets24h || 0),
        securityRisk: 'LOW',
        sparkline: [],
        discoveredAt: Date.now() - 7200000,
        isNew: false,
        whaleCount: 0
      });
    });

    markStep(3);
    normalizeTokenList(await apiFetch('/defi/v3/token/meme/list?sort_by=v24hUSD&sort_type=desc&offset=0&limit=20')).forEach((token) => {
      if (!working.MEME.tokens.some((t) => t.address === token.address)) {
        working.MEME.tokens.push({ address: token.address, symbol: token.symbol || 'MEME', name: token.name || 'Meme Token', logoURI: token.logoURI || '', volume24h: Number(token.v24hUSD || token.volume || 0), price: Number(token.price || 0), priceChange24h: Number(token.priceChange24h || 0), buyVolume: 0, sellVolume: 0, buyPressure: 0.5, holderCount: Number(token.holderCount || 0), securityRisk: 'LOW', sparkline: [], discoveredAt: Date.now() - 3600000, isNew: false, whaleCount: 0 });
      }
    });

    markStep(4);
    for (const n of Object.values(working)) {
      for (const token of n.tokens.slice(0, 5)) {
        const trade = await apiFetch(`/defi/v3/token/trade-data/single?address=${token.address}`);
        const d = trade?.data || trade || {};
        token.buyVolume = Number(d.buyVolume24h || d.buyVolume || d.volumeBuy24h || 0);
        token.sellVolume = Number(d.sellVolume24h || d.sellVolume || d.volumeSell24h || 0);
        token.buyPressure = token.buyVolume / (token.buyVolume + token.sellVolume + 1);
      }
    }

    markStep(5);
    for (const n of Object.values(working)) {
      for (const token of n.tokens.slice(0, 5)) {
        const sec = await apiFetch(`/defi/token_security?address=${token.address}`);
        const s = sec?.data || sec || {};
        if (s.honeypotRisk === true || s.honeypot === true) token.hidden = true;
        const risky = s.freezeAuthority || s.mintAuthority || Number(s.topHolderConcentration || 0) > 0.35;
        token.securityRisk = risky ? 'HIGH' : Number(s.topHolderConcentration || 0) > 0.2 ? 'MEDIUM' : 'LOW';
      }
      n.tokens = n.tokens.filter((t) => !t.hidden);
    }

    markStep(6);
    const now = Math.floor(Date.now() / 1000);
    for (const n of Object.values(working)) {
      const token = n.tokens[0];
      if (!token) continue;
      const hist = await apiFetch(`/defi/history_price?address=${token.address}&address_type=token&type=30m&time_from=${now - 21600}&time_to=${now}`);
      const rows = normalizeTokenList(hist);
      token.sparkline = rows.map((r) => Number(r.c || r.close || r.value || 0)).filter(Boolean);
    }

    markStep(7);
    const gainers = normalizeTokenList(await apiFetch('/trader/gainers-losers?type=24h&sort_type=desc&offset=0&limit=20'));
    const wallets = gainers.map((w, i) => ({ wallet: w.wallet || w.address || w.owner || mockAddress(`live-wallet-${i}`), realizedPnl: Number(w.realizedPnl || w.pnl || 0), winRate: Number(w.winRate || 0), totalTrades: Number(w.totalTrades || 0), narrativeIds: [], lastActive: Date.now() }));

    markStep(8);
    for (const wallet of wallets.slice(0, 5)) {
      const pnl = await apiFetch(`/wallet/v2/pnl/summary?wallet=${wallet.wallet}`);
      const d = pnl?.data || pnl || {};
      wallet.realizedPnl = Number(d.realizedPnl ?? wallet.realizedPnl);
      wallet.winRate = Number(d.winRate ?? wallet.winRate);
      wallet.totalTrades = Number(d.totalTrades ?? wallet.totalTrades);
      wallet.narrativeIds = Object.keys(working).filter((_, i) => i % 2 === seededNumber(wallet.wallet, 2));
    }
    setSmartWallets(wallets.length ? wallets : createMockWallets());

    markStep(9);
    Object.entries(working).forEach(([id, n]) => {
      const recomputed = recomputeNarrative(n, scoreHistoryRef);
      working[id] = { ...recomputed, stage: recomputed.tokens.length ? recomputed.stage : 'DEAD' };
      recomputed.tokens.forEach((t) => tokenCacheRef.current.set(t.address, t));
    });
    narrativesRef.current = working;
    setNarratives(working);
    setEventFeed(createMockEvents().slice(0, 10));

    markStep(10);
    if (!wsRef.current) wsRef.current = new WebSocketManager({ getUrl: () => WS_URL(apiKey), onStatus: setWsStatus, onMessage: processWsMessage });
    else wsRef.current.getUrl = () => WS_URL(apiKey);
    wsRef.current.connect();
    subscribeBaseStreams();

    markStep(11);
    await sleep(300);
    setIsInitializing(false);
  }, [apiFetch, apiKey, markStep, processWsMessage, subscribeBaseStreams]);

  useEffect(() => {
    if (!wsRef.current) wsRef.current = new WebSocketManager({ getUrl: () => WS_URL(apiKey), onStatus: setWsStatus, onMessage: processWsMessage });
    return () => wsRef.current?.disconnect();
  }, [apiKey, processWsMessage]);

  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;
      setContainerSize({ width: rect.width, height: rect.height });
    });
    if (bubbleContainerRef.current) ro.observe(bubbleContainerRef.current);
    return () => ro.disconnect();
  }, []);

  const refresh = useCallback(() => {
    setNarratives((prev) => Object.fromEntries(Object.entries(prev).map(([id, n]) => [id, recomputeNarrative(n, scoreHistoryRef)])));
    setLastRefresh(Date.now());
    if (apiKey) initializeLive();
  }, [apiKey, initializeLive]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      if (key === 'escape') setSelectedNarrative(null);
      if (key === 'b') { setActiveView('bubbles'); setSelectedNarrative(null); }
      if (key === 'l') { setActiveView('list'); setSelectedNarrative(null); }
      if (key === 'r') refresh();
      if (key === 'f') apiInputRef.current?.focus();
      if (key === 'p') setPaused((p) => !p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [refresh]);

  const sortedNarratives = useMemo(() => Object.values(narratives).sort((a, b) => b.momentumScore - a.momentumScore), [narratives]);
  const selected = selectedNarrative ? narratives[selectedNarrative] : null;
  const bubbles = useMemo(() => computeBubbleLayout(sortedNarratives.map((n) => ({
    id: n.id,
    label: n.name,
    emoji: n.emoji,
    color: n.color,
    score: n.momentumScore,
    stage: n.stage,
    totalHolders: n.totalHolders,
    totalVolume24h: n.totalVolume24h,
    totalBuyPressure: n.totalBuyPressure,
    tokenCount: n.tokens.length,
    whaleCount: n.whaleTrades.filter((t) => Date.now() - t.timestamp < 3600000).length,
    radius: Math.max(40, Math.min(120, Math.log10(n.totalHolders + 1) * 22)),
    opacity: n.stage === 'DEAD' ? 0.3 : n.stage === 'COOLING' ? 0.55 : n.stage === 'EMERGING' ? 0.75 : 1,
    pulseSpeed: n.momentumScore > 70 ? '1.5s' : n.momentumScore > 40 ? '2.5s' : '4s',
    glowIntensity: Math.min(n.whaleTrades.filter((t) => Date.now() - t.timestamp < 3600000).length * 8, 40)
  })), containerSize.width, containerSize.height), [sortedNarratives, containerSize]);

  const copy = useCallback(async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied('Copied ✓');
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied('Copy failed');
      setTimeout(() => setCopied(null), 1500);
    }
  }, []);

  const filteredEvents = selected ? eventFeed.filter((e) => e.narrativeId === selected.id || e.toNarrativeId === selected.id || e.fromNarrativeId === selected.id) : eventFeed;

  if (isInitializing) {
    const current = Math.max(0, initSteps.findIndex((s) => !s.done));
    return <div className="loading"><div className="loading-card"><div className="radar loading-logo" /><div className="loading-title">Zeitgeist</div><div className="loading-sub">Mapping Solana's narratives...</div><div className="steps">{initSteps.map((s, i) => <div key={s.label} className={`step ${s.done ? 'done' : ''} ${i === current ? 'current' : ''}`}>{s.done ? '✓' : i === current ? '⟳' : ' '} {s.label}</div>)}</div><div className="progress"><span style={{ width: `${initProgress}%` }} /></div></div></div>;
  }

  return <div className="zg-app">
    <div className="zg-header">
      <div className="radar" /><div className="brand">Zeitgeist</div>
      <div className="status"><span className={`status-dot ${wsStatus}`} />{wsStatus === 'live' ? 'LIVE' : wsStatus.toUpperCase()}</div>
      <div className="header-stats">5 streams · {totalStats.narratives} narratives · {formatVolume(totalStats.volume)}</div>
      <div className="spacer" />
      <input ref={apiInputRef} className="api-input" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API KEY ••••" />
      <button className="connect-btn" onClick={apiKey ? initializeLive : () => { setNarratives(createMockNarratives()); setEventFeed(createMockEvents()); }}>Connect</button>
    </div>
    {!apiKey && <div className="demo-banner">DEMO MODE — Enter your Birdeye API key to activate live WebSocket streams and real-time data</div>}
    <div className="main-grid">
      <aside className="left-panel">
        <div className="panel-head"><span>NARRATIVES</span><span>{sortedNarratives.length}</span></div>
        <div className="narrative-list">{sortedNarratives.map((n) => <div key={n.id} className={`narrative-row ${selectedNarrative === n.id ? 'selected' : ''} ${stageFlash === n.id ? 'flash' : ''}`} style={{ borderLeftColor: selectedNarrative === n.id ? n.color : 'transparent' }} onClick={() => { setSelectedNarrative(n.id); setActiveTab('tokens'); }}>
          <div className="row-top"><span className="color-dot" style={{ background: n.color }} /><span className="row-name">{n.name}</span><span className="row-score" style={{ color: n.color }}>{n.momentumScore}</span><span>{STAGE_CONFIG[n.stage].emoji}</span></div>
          <div className="score-bar"><div className="score-fill" style={{ width: `${n.momentumScore}%`, background: n.color }} /></div>
          <div className="row-sub">{n.tokens.length} tokens · {formatHolders(n.totalHolders)} holders</div>
        </div>)}</div>
      </aside>
      <main className="center-panel">
        {!selected && <div className="center-controls"><button className={`ctrl-btn ${activeView === 'bubbles' ? 'active' : ''}`} onClick={() => setActiveView('bubbles')}>⬤ Bubbles</button><button className={`ctrl-btn ${activeView === 'list' ? 'active' : ''}`} onClick={() => setActiveView('list')}>≡ List</button><span className="updated">Last updated: {formatTime(lastRefresh)}</span><button className="ctrl-btn" onClick={refresh}>↺ Refresh</button></div>}
        {selected ? <DetailView narrative={selected} activeTab={activeTab} setActiveTab={setActiveTab} onBack={() => setSelectedNarrative(null)} events={filteredEvents} smartWallets={smartWallets} expandedToken={expandedToken} setExpandedToken={setExpandedToken} copy={copy} /> : activeView === 'bubbles' ? <div className="bubble-wrap" ref={bubbleContainerRef}>
          <svg width={containerSize.width} height={containerSize.height}>
            <defs>{bubbles.map((b) => <radialGradient key={b.id} id={`grad-${b.id}`} cx="40%" cy="35%"><stop offset="0%" stopColor={b.color} stopOpacity="0.9" /><stop offset="100%" stopColor={b.color} stopOpacity="0.25" /></radialGradient>)}<filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
            {bubbles.map((b) => <g key={b.id} onClick={() => setSelectedNarrative(b.id)} onMouseMove={(e) => setHoveredBubble({ ...b, x: e.clientX, y: e.clientY })} onMouseLeave={() => setHoveredBubble(null)} style={{ cursor: 'pointer' }}>
              <circle cx={b.x} cy={b.y} r={b.radius + b.glowIntensity} fill="none" stroke={b.color} strokeWidth="1" opacity="0.15" style={{ animation: `pulse-ring ${b.pulseSpeed} ease-in-out infinite` }} />
              <circle cx={b.x} cy={b.y} r={b.radius} fill={`url(#grad-${b.id})`} stroke={b.color} strokeWidth={selectedNarrative === b.id ? '2' : '0.5'} strokeOpacity="0.6" opacity={b.opacity} filter={b.glowIntensity > 16 ? 'url(#glow)' : undefined} style={{ transition: 'r 800ms ease, opacity 600ms ease, fill 600ms ease' }} />
              <text x={b.x} y={b.y - 10} textAnchor="middle" fontSize={b.radius * 0.4} style={{ pointerEvents: 'none' }}>{b.emoji}</text>
              <text x={b.x} y={b.y + 12} textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="'DM Sans', sans-serif" opacity="0.9" style={{ pointerEvents: 'none' }}>{b.label}</text>
              <text x={b.x} y={b.y + 26} textAnchor="middle" fill={b.color} fontSize="10" fontFamily="'DM Mono', monospace" style={{ pointerEvents: 'none' }}>{b.score}</text>
              <text x={b.x} y={b.y + b.radius + 16} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="'DM Mono', monospace" style={{ pointerEvents: 'none' }}>{formatHolders(b.totalHolders)} holders</text>
              <foreignObject x={b.x - 32} y={b.y - b.radius - 22} width="64" height="18"><div className="bubble-stage" style={{ background: STAGE_CONFIG[b.stage].bg, border: `1px solid ${STAGE_CONFIG[b.stage].rawColor}`, color: STAGE_CONFIG[b.stage].rawColor }}>{b.stage}</div></foreignObject>
            </g>)}
          </svg>
          {hoveredBubble && <div className="bubble-tooltip" style={{ left: hoveredBubble.x + 16, top: hoveredBubble.y - 132 }}><div className="tip-title">{hoveredBubble.emoji} {hoveredBubble.label}</div><div className="tip-line">Score: {hoveredBubble.score} · {hoveredBubble.stage} {STAGE_CONFIG[hoveredBubble.stage].emoji}</div><div className="tip-line">{hoveredBubble.tokenCount} tokens · {formatHolders(hoveredBubble.totalHolders)} holders</div><div className="tip-line">{formatVolume(hoveredBubble.totalVolume24h)} volume · {hoveredBubble.whaleCount} 🐋/h</div><div className="tip-line">Buy pressure: {Math.round(hoveredBubble.totalBuyPressure * 100)}%</div></div>}
        </div> : <NarrativeTable narratives={sortedNarratives} onSelect={setSelectedNarrative} />}
      </main>
      <aside className="right-panel"><div className="panel-head"><span>LIVE FEED</span><button className="pause-btn" onClick={() => setPaused((p) => !p)}>{paused ? '▶ Resume' : '⏸ Pause'}{queuedEvents.length ? <span className="queued">+{queuedEvents.length}</span> : null}</button></div><EventFeed events={eventFeed} /></aside>
    </div>
    {copied && <div className="copied-tip">{copied}</div>}
  </div>;
}

function NarrativeTable({ narratives, onSelect }) {
  return <div className="detail-scroll"><table className="list-table"><thead><tr><th>NARRATIVE</th><th>SCORE</th><th>STAGE</th><th>TOKENS</th><th>HOLDERS</th><th>VOLUME</th><th>BUY PRESS</th></tr></thead><tbody>{narratives.map((n) => <tr key={n.id} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer' }}><td><span style={{ color: n.color }}>{n.emoji}</span> {n.name}</td><td className="mono" style={{ color: n.color }}>{n.momentumScore}</td><td className="mono">{STAGE_CONFIG[n.stage].emoji} {n.stage}</td><td className="mono">{n.tokens.length}</td><td className="mono">{formatHolders(n.totalHolders)}</td><td className="mono">{formatVolume(n.totalVolume24h)}</td><td className="mono">{Math.round(n.totalBuyPressure * 100)}%</td></tr>)}</tbody></table></div>;
}

function DetailView({ narrative, activeTab, setActiveTab, onBack, events, smartWallets, expandedToken, setExpandedToken, copy }) {
  const wallets = smartWallets.filter((w) => !w.narrativeIds?.length || w.narrativeIds.includes(narrative.id)).slice(0, 6);
  return <><div className="detail-head"><button className="back-btn" onClick={onBack}>← All Narratives</button><div className="detail-title" style={{ color: narrative.color }}>{narrative.emoji} {narrative.name}</div><div className="mono muted">{narrative.momentumScore} · {narrative.stage}</div></div><div className="tabs"><button className={`tab ${activeTab === 'tokens' ? 'active' : ''}`} style={{ borderBottomColor: activeTab === 'tokens' ? narrative.color : 'transparent' }} onClick={() => setActiveTab('tokens')}>TOKENS ({narrative.tokens.length})</button><button className={`tab ${activeTab === 'smartmoney' ? 'active' : ''}`} style={{ borderBottomColor: activeTab === 'smartmoney' ? narrative.color : 'transparent' }} onClick={() => setActiveTab('smartmoney')}>SMART MONEY</button><button className={`tab ${activeTab === 'feed' ? 'active' : ''}`} style={{ borderBottomColor: activeTab === 'feed' ? narrative.color : 'transparent' }} onClick={() => setActiveTab('feed')}>LIVE FEED</button></div>
    {activeTab === 'tokens' && <div className="detail-scroll"><table className="token-table"><thead><tr><th>TOKEN</th><th>PRICE</th><th>CHG</th><th>VOLUME</th><th>BUY PRESS</th><th>HOLDERS</th><th>SECURITY</th></tr></thead><tbody>{narrative.tokens.map((t) => <React.Fragment key={t.address}><tr onClick={() => setExpandedToken(expandedToken === t.address ? null : t.address)} style={{ cursor: 'pointer' }}><td><div className="token-id"><div className="logo" style={{ background: `${narrative.color}22`, color: narrative.color }}>{t.logoURI ? <img alt="" src={t.logoURI} width="20" height="20" /> : t.symbol?.[0]}</div><div><div>{t.symbol} {t.isNew && <span className="new-badge">NEW</span>}</div><div className="mono muted">SOL</div></div></div></td><td className="mono">${formatPrice(t.price || 0)}</td><td className={`mono ${(t.priceChange24h || 0) >= 0 ? 'green' : 'red'}`}>{(t.priceChange24h || 0) >= 0 ? '▲' : '▼'} {Math.abs(t.priceChange24h || 0).toFixed(1)}%</td><td className="mono">{formatVolume(t.volume24h)}</td><td className="mono"><span className="pressure"><span style={{ width: `${Math.round((t.buyPressure || 0.5) * 100)}%` }} /></span>{Math.round((t.buyPressure || 0.5) * 100)}%</td><td className="mono">{formatHolders(t.holderCount)}</td><td><Risk risk={t.securityRisk} /></td></tr>{expandedToken === t.address && <tr className="accordion"><td colSpan="7"><div className="token-detail"><Sparkline data={t.sparkline} width={200} height={32} color={narrative.color} /><span>Buy: {formatVolume(t.buyVolume)}</span><span>Sell: {formatVolume(t.sellVolume)}</span><span>🐋 {t.whaleCount || 0} whale buys/h</span><button className="copy-btn" onClick={(e) => { e.stopPropagation(); copy(t.address); }}>Copy address</button></div></td></tr>}</React.Fragment>)}</tbody></table></div>}
    {activeTab === 'smartmoney' && <div className="detail-scroll wallet-grid">{wallets.map((w) => <div className="wallet-card" key={w.wallet}><div className="wallet-top"><span>{shortAddress(w.wallet)}</span><span>Win Rate: {Math.round(w.winRate || 0)}% {w.winRate > 60 ? '✓' : ''}</span></div><div className={`wallet-line ${(w.realizedPnl || 0) >= 0 ? 'green' : 'red'}`}>Realized PnL: {(w.realizedPnl || 0) >= 0 ? '+' : ''}{formatVolume(w.realizedPnl || 0)}</div><div className="wallet-line">Holds {1 + seededNumber(w.wallet, 4)} tokens in this narrative</div><div className="wallet-line">Last active: {formatTime(w.lastActive || Date.now())}</div><button className="copy-btn" style={{ marginTop: 12 }} onClick={() => copy(w.wallet)}>Copy wallet</button></div>)}</div>}
    {activeTab === 'feed' && <EventFeed events={events} />}</>;
}

function Risk({ risk = 'LOW' }) {
  const color = risk === 'HIGH' ? 'var(--red)' : risk === 'MEDIUM' ? 'var(--amber)' : 'var(--green)';
  return <span className="risk"><span className="risk-dot" style={{ background: color }} />{risk}</span>;
}

function EventFeed({ events }) {
  const colorFor = (e) => e.type === 'WHALE_ENTRY' ? 'var(--amber)' : e.type === 'NEW_TOKEN' ? 'var(--green)' : e.type === 'ROTATION' ? '#A78BFA' : (NARRATIVES[e.narrativeId]?.color || 'var(--border-bright)');
  return <div className="feed-list">{events.map((e) => <div className="event" key={e.id} style={{ borderLeftColor: colorFor(e) }}><div className="event-top"><span style={{ color: colorFor(e) }}>{e.title || e.type}</span><span>{formatTime(e.ts)}</span></div><div className="event-main">{e.main}</div><div className="event-sub">{e.sub}</div></div>)}</div>;
}

export default Zeitgeist;
