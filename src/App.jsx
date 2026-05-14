import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NARRATIVES, STAGE_CONFIG, INIT_STEPS } from './constants';
import {
  formatVolume,
  formatHolders,
  formatTime,
  shortAddress,
  seededNumber,
  sleep,
  normalizeTokenList,
  classifyToken,
  recomputeNarrative,
  computeBubbleLayout,
} from './utils';
import { WebSocketManager, WS_URL } from './services/WebSocketManager';
import { createApiFetcher } from './services/birdeyeApi';
import {
  createMockNarratives,
  createMockWallets,
  createMockEvents,
  buildEmptyNarratives,
} from './data/mockData';
import LoadingScreen from './components/LoadingScreen';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BubbleMap from './components/BubbleMap';
import NarrativeTable from './components/NarrativeTable';
import DetailView from './components/DetailView';
import EventFeed from './components/EventFeed';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [isInitializing, setIsInitializing] = useState(false);
  const [initSteps, setInitStepsState] = useState(INIT_STEPS.map((label) => ({ label, done: false })));
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
  const enrichmentFlushTimerRef = useRef(null);
  const recomputeTimerRef = useRef(null);
  const bubbleContainerRef = useRef(null);
  const apiInputRef = useRef(null);

  useEffect(() => { narrativesRef.current = narratives; }, [narratives]);

  useEffect(() => {
    setTotalStats({
      narratives: Object.keys(narratives).length,
      tokens: Object.values(narratives).reduce((s, n) => s + n.tokens.length, 0),
      volume: Object.values(narratives).reduce((s, n) => s + n.totalVolume24h, 0),
      holders: Object.values(narratives).reduce((s, n) => s + n.totalHolders, 0),
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
    const fetcher = createApiFetcher(apiKey);
    return fetcher(path);
  }, [apiKey]);

  const markStep = useCallback((index) => {
    setInitStepsState(INIT_STEPS.map((label, i) => ({ label, done: i <= index })));
    setInitProgress(Math.round(((index + 1) / INIT_STEPS.length) * 100));
  }, []);

  const subscribeBaseStreams = useCallback(() => {
    if (!wsRef.current) return;
    wsRef.current.subscribe('new-listing', { type: 'SUBSCRIBE_TOKEN_NEW_LISTING', data: { chain: 'solana' } });
    wsRef.current.subscribe('large-trades', { type: 'SUBSCRIBE_LARGE_TRADE_TXS', data: { chain: 'solana', minVolumeUsd: 50000 } });
    wsRef.current.subscribe('meme', { type: 'SUBSCRIBE_MEME', data: { chain: 'solana' } });
    wsRef.current.subscribe('new-pair', { type: 'SUBSCRIBE_NEW_PAIR', data: { chain: 'solana' } });
    Object.values(narrativesRef.current)
      .flatMap((n) => n.tokens.slice(0, 2))
      .forEach((token) => {
        wsRef.current.subscribe(`stats-${token.address}`, { type: 'SUBSCRIBE_TOKEN_STATS', data: { address: token.address } });
      });
  }, []);

  const scheduleRecompute = useCallback(() => {
    clearTimeout(recomputeTimerRef.current);
    recomputeTimerRef.current = setTimeout(() => {
      const previous = narrativesRef.current;
      const next = Object.fromEntries(
        Object.entries(previous).map(([id, n]) => [id, recomputeNarrative(n, scoreHistoryRef)])
      );
      Object.values(next).forEach((n) => {
        if (previous[n.id]?.stage !== n.stage) {
          setStageFlash(n.id);
          setTimeout(() => setStageFlash(null), 700);
          addEvent({
            type: 'STAGE_CHANGE',
            narrativeId: n.id,
            title: 'STAGE CHANGE',
            main: `\u26A1 ${n.id}: ${previous[n.id]?.stage} \u2192 ${n.stage}`,
            sub: `Momentum score ${n.momentumScore}`,
          });
        }
      });
      setNarratives(next);
      setLastRefresh(Date.now());
    }, 5000);
  }, [addEvent]);

  const upsertToken = useCallback((narrativeId, token) => {
    tokenCacheRef.current.set(token.address, token);
    setNarratives((prev) => {
      const n = prev[narrativeId] || { ...NARRATIVES[narrativeId], tokens: [], whaleTrades: [] };
      const tokens = [token, ...n.tokens.filter((t) => t.address !== token.address)].slice(0, 24);
      return { ...prev, [narrativeId]: recomputeNarrative({ ...n, tokens }, scoreHistoryRef) };
    });
    if (wsRef.current && token.address)
      wsRef.current.subscribe(`stats-${token.address}`, { type: 'SUBSCRIBE_TOKEN_STATS', data: { address: token.address } });
    scheduleRecompute();
  }, [scheduleRecompute]);

  const enrichQueuedTokens = useCallback(async (flushAll = false) => {
    if (!apiKey) return;
    const batchSize = flushAll ? enrichmentQueueRef.current.length : 10;
    const batch = enrichmentQueueRef.current.splice(0, batchSize);
    if (!batch.length) return;
    const list = batch.map((t) => t.address).join(',');
    const meta = await apiFetch(`/defi/v3/token/meta-data/multiple?list_address=${list}`);
    const metaRows = normalizeTokenList(meta);
    batch.forEach((token) => {
      const m = metaRows.find((row) => row.address === token.address) || token;
      const nextToken = {
        ...token, ...m,
        isNew: true,
        volume24h: m.volume24h || 0,
        holderCount: m.holderCount || 0,
        buyVolume: 0, sellVolume: 0,
        buyPressure: 0.5,
        securityRisk: 'LOW',
        sparkline: [],
      };
      upsertToken(classifyToken(nextToken), nextToken);
    });
  }, [apiKey, apiFetch, upsertToken]);

  const processWsMessage = useCallback((message) => {
    const type = message?.type;
    const data = message?.data || message;
    if (!type) return;

    if (type === 'TOKEN_NEW_LISTING_DATA') {
      const token = {
        address: data.address,
        symbol: data.symbol || 'NEW',
        name: data.name || data.symbol || 'New Token',
        discoveredAt: Date.now(),
        createdAt: data.createdAt,
      };
      enrichmentQueueRef.current.push(token);
      addEvent({
        type: 'NEW_TOKEN',
        narrativeId: classifyToken(token),
        title: 'NEW TOKEN',
        main: `\u{1F331} ${token.symbol} launched`,
        sub: shortAddress(token.address),
      });
      if (enrichmentQueueRef.current.length >= 10) {
        clearTimeout(enrichmentFlushTimerRef.current);
        enrichQueuedTokens(false);
      } else {
        clearTimeout(enrichmentFlushTimerRef.current);
        enrichmentFlushTimerRef.current = setTimeout(() => enrichQueuedTokens(true), 2500);
      }
    }

    if (type === 'LARGE_TRADE_TXS_DATA') {
      const tokenAddress = data.tokenAddress || data.address;
      const found = Object.values(narrativesRef.current).find((n) =>
        n.tokens.some((t) => t.address === tokenAddress)
      );
      if (!found) return;
      const trade = {
        txHash: data.txHash,
        wallet: data.wallet,
        tokenAddress,
        volumeUsd: Number(data.volumeUsd || 0),
        side: data.side || 'buy',
        timestamp: data.timestamp || Date.now(),
      };
      setNarratives((prev) => ({
        ...prev,
        [found.id]: {
          ...prev[found.id],
          whaleTrades: [trade, ...prev[found.id].whaleTrades].slice(0, 30),
        },
      }));
      addEvent({
        type: 'WHALE_ENTRY',
        narrativeId: found.id,
        title: 'WHALE ENTRY',
        main: `\u{1F40B} ${formatVolume(trade.volumeUsd)} into ${found.name}`,
        sub: `${shortAddress(trade.wallet)} ${trade.side} ${shortAddress(tokenAddress)}`,
      });
      scheduleRecompute();
    }

    if (type === 'TOKEN_STATS_DATA') {
      const address = data.address || data.tokenAddress;
      setNarratives((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([id, n]) => [
            id,
            {
              ...n,
              tokens: n.tokens.map((t) =>
                t.address === address
                  ? {
                      ...t,
                      price: data.price ?? t.price,
                      volume24h: data.volume24h ?? t.volume24h,
                      priceChange24h: data.priceChange24h ?? t.priceChange24h,
                      holderCount: data.holderCount ?? data.uniqueWallets24h ?? t.holderCount,
                    }
                  : t
              ),
            },
          ])
        )
      );
      scheduleRecompute();
    }

    if (type === 'MEME_DATA') {
      const token = {
        address: data.address,
        symbol: data.symbol || 'MEME',
        name: data.name || 'Meme Token',
        volume24h: data.volume || 0,
        priceChange24h: data.priceChange || 0,
        holderCount: data.holderCount || 0,
        discoveredAt: Date.now(),
        isNew: true,
      };
      upsertToken('MEME', token);
    }

    if (type === 'NEW_PAIR_DATA')
      addEvent({
        type: 'NEW_PAIR',
        narrativeId: 'MEME',
        title: 'LIQUIDITY',
        main: '\u25CE New Solana pair confirmed',
        sub: `${formatVolume(data.liquidity || 0)} liquidity \u00B7 ${shortAddress(data.baseAddress || data.address)}`,
      });
  }, [addEvent, enrichQueuedTokens, scheduleRecompute, upsertToken]);

  const initializeLive = useCallback(async () => {
    if (!apiKey.trim()) return;
    setIsInitializing(true);
    setInitStepsState(INIT_STEPS.map((label) => ({ label, done: false })));
    setInitProgress(0);
    const working = buildEmptyNarratives();

    markStep(0);
    const tokenList = normalizeTokenList(
      await apiFetch('/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=50&min_liquidity=50000')
    );
    const addresses = tokenList.map((t) => t.address).filter(Boolean).slice(0, 50);

    markStep(1);
    const metaRows = normalizeTokenList(
      await apiFetch(`/defi/v3/token/meta-data/multiple?list_address=${addresses.join(',')}`)
    );
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
        whaleCount: 0,
      });
    });

    markStep(3);
    normalizeTokenList(
      await apiFetch('/defi/v3/token/meme/list?sort_by=v24hUSD&sort_type=desc&offset=0&limit=20')
    ).forEach((token) => {
      if (!working.MEME.tokens.some((t) => t.address === token.address)) {
        working.MEME.tokens.push({
          address: token.address,
          symbol: token.symbol || 'MEME',
          name: token.name || 'Meme Token',
          logoURI: token.logoURI || '',
          volume24h: Number(token.v24hUSD || token.volume || 0),
          price: Number(token.price || 0),
          priceChange24h: Number(token.priceChange24h || 0),
          buyVolume: 0,
          sellVolume: 0,
          buyPressure: 0.5,
          holderCount: Number(token.holderCount || 0),
          securityRisk: 'LOW',
          sparkline: [],
          discoveredAt: Date.now() - 3600000,
          isNew: false,
          whaleCount: 0,
        });
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
      const hist = await apiFetch(
        `/defi/history_price?address=${token.address}&address_type=token&type=30m&time_from=${now - 21600}&time_to=${now}`
      );
      const rows = normalizeTokenList(hist);
      token.sparkline = rows.map((r) => Number(r.c || r.close || r.value || 0)).filter(Boolean);
    }

    markStep(7);
    const gainers = normalizeTokenList(
      await apiFetch('/trader/gainers-losers?type=24h&sort_type=desc&offset=0&limit=20')
    );
    const wallets = gainers.map((w, i) => ({
      wallet: w.wallet || w.address || w.owner || seededNumber(`live-wallet-${i}`) + '',
      realizedPnl: Number(w.realizedPnl || w.pnl || 0),
      winRate: Number(w.winRate || 0),
      totalTrades: Number(w.totalTrades || 0),
      narrativeIds: [],
      lastActive: Date.now(),
    }));

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
    if (!wsRef.current)
      wsRef.current = new WebSocketManager({ getUrl: () => WS_URL(apiKey), onStatus: setWsStatus, onMessage: processWsMessage });
    else {
      wsRef.current.getUrl = () => WS_URL(apiKey);
      wsRef.current.onMessage = processWsMessage;
    }
    wsRef.current.connect();
    subscribeBaseStreams();

    markStep(11);
    await sleep(300);
    setIsInitializing(false);
  }, [apiFetch, apiKey, markStep, processWsMessage, subscribeBaseStreams]);

  useEffect(() => {
    if (!wsRef.current)
      wsRef.current = new WebSocketManager({ getUrl: () => WS_URL(apiKey), onStatus: setWsStatus, onMessage: processWsMessage });
    else {
      wsRef.current.getUrl = () => WS_URL(apiKey);
      wsRef.current.onMessage = processWsMessage;
    }
  }, [apiKey, processWsMessage]);

  useEffect(() => () => wsRef.current?.disconnect(), []);
  useEffect(() => () => clearTimeout(enrichmentFlushTimerRef.current), []);

  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;
      setContainerSize({ width: rect.width, height: rect.height });
    });
    if (bubbleContainerRef.current) ro.observe(bubbleContainerRef.current);
    return () => ro.disconnect();
  }, []);

  const refresh = useCallback(() => {
    setNarratives((prev) =>
      Object.fromEntries(Object.entries(prev).map(([id, n]) => [id, recomputeNarrative(n, scoreHistoryRef)]))
    );
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

  const sortedNarratives = useMemo(
    () => Object.values(narratives).sort((a, b) => b.momentumScore - a.momentumScore),
    [narratives]
  );

  const selected = selectedNarrative ? narratives[selectedNarrative] : null;

  const bubbles = useMemo(
    () =>
      computeBubbleLayout(
        sortedNarratives.map((n) => ({
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
          glowIntensity: Math.min(n.whaleTrades.filter((t) => Date.now() - t.timestamp < 3600000).length * 8, 40),
        })),
        containerSize.width,
        containerSize.height
      ),
    [sortedNarratives, containerSize]
  );

  const copy = useCallback(async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied('Copied \u2713');
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied('Copy failed');
      setTimeout(() => setCopied(null), 1500);
    }
  }, []);

  const filteredEvents = selected
    ? eventFeed.filter(
        (e) => e.narrativeId === selected.id || e.toNarrativeId === selected.id || e.fromNarrativeId === selected.id
      )
    : eventFeed;

  if (isInitializing) {
    return <LoadingScreen initSteps={initSteps} initProgress={initProgress} />;
  }

  return (
    <div className="zg-app">
      <Header
        wsStatus={wsStatus}
        totalStats={totalStats}
        apiKey={apiKey}
        setApiKey={setApiKey}
        apiInputRef={apiInputRef}
        onConnect={
          apiKey
            ? initializeLive
            : () => {
                setNarratives(createMockNarratives());
                setEventFeed(createMockEvents());
              }
        }
      />

      {!apiKey && (
        <div className="demo-banner">
          DEMO MODE &mdash; Enter your Birdeye API key to activate live WebSocket streams and real-time data
        </div>
      )}

      <div className="main-grid">
        <Sidebar
          sortedNarratives={sortedNarratives}
          selectedNarrative={selectedNarrative}
          stageFlash={stageFlash}
          onSelect={(id) => { setSelectedNarrative(id); setActiveTab('tokens'); }}
        />

        <main className="center-panel">
          {!selected && (
            <div className="center-controls">
              <button
                className={`ctrl-btn ${activeView === 'bubbles' ? 'active' : ''}`}
                onClick={() => setActiveView('bubbles')}
              >
                ◉ Bubbles
              </button>
              <button
                className={`ctrl-btn ${activeView === 'list' ? 'active' : ''}`}
                onClick={() => setActiveView('list')}
              >
                ≡ List
              </button>
              <span className="updated">Last updated: {formatTime(lastRefresh)}</span>
              <button className="ctrl-btn" onClick={refresh}>↺ Refresh</button>
            </div>
          )}

          {selected ? (
            <DetailView
              narrative={selected}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onBack={() => setSelectedNarrative(null)}
              events={filteredEvents}
              smartWallets={smartWallets}
              expandedToken={expandedToken}
              setExpandedToken={setExpandedToken}
              copy={copy}
            />
          ) : activeView === 'bubbles' ? (
            <BubbleMap
              bubbles={bubbles}
              containerSize={containerSize}
              bubbleContainerRef={bubbleContainerRef}
              selectedNarrative={selectedNarrative}
              hoveredBubble={hoveredBubble}
              setSelectedNarrative={setSelectedNarrative}
              setHoveredBubble={setHoveredBubble}
            />
          ) : (
            <NarrativeTable narratives={sortedNarratives} onSelect={setSelectedNarrative} />
          )}
        </main>

        <aside className="right-panel">
          <div className="panel-head">
            <span>LIVE FEED</span>
            <button className="pause-btn" onClick={() => setPaused((p) => !p)}>
              {paused ? '\u25B6 Resume' : '\u23F8 Pause'}
              {queuedEvents.length ? <span className="queued">+{queuedEvents.length}</span> : null}
            </button>
          </div>
          <EventFeed events={eventFeed} />
        </aside>
      </div>

      {copied && <div className="copied-tip">{copied}</div>}
    </div>
  );
}
