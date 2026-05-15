# Zeitgeist

**Solana's On-Chain Narrative Intelligence Terminal** — a real-time market intelligence app that detects which Solana narratives capital is rotating into before they trend on social media.

Zeitgeist was built for the Birdeye Data Build-in-Public Competition. It uses Birdeye REST and WebSocket data to cluster tokens into market narratives, score lifecycle momentum, visualize capital rotation, and generate shareable alpha cards for public distribution.

## Problem

Solana cycles are usually narrative-led: AI agents, meme supercycles, gaming seasons, DePIN, political coins, animal coins, and other themes. Those narratives form on-chain first: new tokens launch in clusters, liquidity appears, whales enter, buy pressure rises, and holder counts expand before Twitter notices.

Zeitgeist answers the trader question:

> What narrative is Solana money rotating into right now — and how early are we?

## What it does

- Clusters new and trending Solana tokens into 8 narratives.
- Scores each narrative from 0–100 using volume velocity, launch rate, whale activity, and buy pressure.
- Classifies lifecycle stage: `EMERGING`, `HEATING`, `PEAKING`, `COOLING`, `DEAD`.
- Renders a living bubble map where size = holders, color/stage = lifecycle, glow = whale activity.
- Adds a capital rotation view showing flow between narratives.
- Streams live events: new listings, meme activity, pairs, stats, large trades.
- Shows a score evidence drawer so every momentum score is auditable.
- Tracks API/stream health, rate-limit fallback, and WebSocket event counts.
- Provides local watchlist alerts for stage changes, whale entries, score thresholds, and launch bursts.
- Exports shareable alpha cards as PNGs for X/community engagement.
- Runs beautifully in mock mode with no API key.

## Architecture

```text
Birdeye REST seed/enrichment ─┐
                              ├─ Token cache ─ Narrative clustering ─ Momentum engine
Birdeye WebSocket streams ────┘                    │
                                                   ├─ Bubble map
                                                   ├─ Rotation view
                                                   ├─ Evidence drawer
                                                   ├─ Event feed / alerts
                                                   └─ Alpha card export
```

## Birdeye integration surface

Zeitgeist integrates **8 REST endpoint types** and **5 WebSocket streams**.

### REST

| Purpose | Endpoint |
| --- | --- |
| Trending token seed | `/defi/tokenlist` |
| Batch metadata | `/defi/v3/token/meta-data/multiple` |
| Buy/sell pressure | `/defi/v3/token/trade-data/single` |
| Security filter | `/defi/token_security` |
| Smart wallet discovery | `/trader/gainers-losers` |
| Meme baseline | `/defi/v3/token/meme/list` |
| Wallet PnL validation | `/wallet/v2/pnl/summary` |
| Price history sparklines | `/defi/history_price` |

### WebSocket

| Stream | Use |
| --- | --- |
| `SUBSCRIBE_TOKEN_NEW_LISTING` | New token launches |
| `SUBSCRIBE_LARGE_TRADE_TXS` | Whale activity / capital flow |
| `SUBSCRIBE_TOKEN_STATS` | Live token momentum |
| `SUBSCRIBE_MEME` | Meme narrative feed |
| `SUBSCRIBE_NEW_PAIR` | Liquidity confirmation |

The WebSocket manager maintains one persistent connection, queues outbound messages while disconnected, resubscribes after reconnect, uses exponential backoff, and includes a protocol fallback for provider handshake compatibility.

## Momentum score

```text
Volume velocity      30 pts  log-scaled 24h volume
Launch rate          25 pts  new tokens discovered in the last hour
Whale activity       25 pts  large trade volume in the last hour
Buy pressure         20 pts  buy volume / total volume
```

The Evidence drawer in each narrative shows these component scores and the raw signals behind them.

## Demo flow for judges

1. Open the app without an API key: mock mode renders instantly.
2. Show the bubble map: MEME should be visibly largest; AI/DePIN are heating.
3. Switch to `↔ Rotation`: show capital moving from weak narratives to active ones.
4. Click `Meme` or `AI & Agents`: show token table, smart money, evidence, and live feed.
5. Click `Export Alpha Card`: download a polished PNG narrative card.
6. Show the right rail: Data Health + Watchlist Alerts + Live Feed.
7. Enter a Birdeye key and connect: live WebSocket streams activate.

## Local setup

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Live API behavior

The app is designed to degrade gracefully under rate limits. During live testing, Birdeye REST seed calls may return `429`; when that happens, Zeitgeist keeps the full mock baseline visible while live WebSocket streams continue to update the terminal. The Data Health panel surfaces this as `FALLBACK` instead of silently blanking the UI.

API keys are only used in request headers / WebSocket URL construction and are never logged.

## Project structure

```text
src/
  App.jsx                     state orchestration and Birdeye wiring
  App.css                     dark terminal UI system
  components/                 BubbleMap, RotationView, DetailView, EvidencePanel, etc.
  constants/                  narrative and stage definitions
  data/mockData.js            full first-paint mock dataset
  services/                   REST client and WebSocket manager
  utils/                      formatting, scoring, layout, export, rotation helpers
```

## Why it should stand out

Most crypto dashboards show token tables after the move is obvious. Zeitgeist organizes on-chain activity into narrative-level intelligence: what theme is forming, whether it is early or late, where whales are entering, and how capital is rotating across Solana sectors in real time.
