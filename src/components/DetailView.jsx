import React from 'react';
import { formatVolume, formatPrice, formatHolders, formatTime, shortAddress, seededNumber } from '../utils';
import Sparkline from './Sparkline';
import Risk from './Risk';
import EventFeed from './EventFeed';

export default function DetailView({
  narrative,
  activeTab,
  setActiveTab,
  onBack,
  events,
  smartWallets,
  expandedToken,
  setExpandedToken,
  copy,
}) {
  const wallets = smartWallets
    .filter((w) => !w.narrativeIds?.length || w.narrativeIds.includes(narrative.id))
    .slice(0, 6);

  return (
    <>
      <div className="detail-head">
        <button className="back-btn" onClick={onBack}>&larr; All Narratives</button>
        <div className="detail-title" style={{ color: narrative.color }}>
          {narrative.emoji} {narrative.name}
        </div>
        <div className="mono muted">{narrative.momentumScore} &middot; {narrative.stage}</div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'tokens' ? 'active' : ''}`}
          style={{ borderBottomColor: activeTab === 'tokens' ? narrative.color : 'transparent' }}
          onClick={() => setActiveTab('tokens')}
        >
          TOKENS ({narrative.tokens.length})
        </button>
        <button
          className={`tab ${activeTab === 'smartmoney' ? 'active' : ''}`}
          style={{ borderBottomColor: activeTab === 'smartmoney' ? narrative.color : 'transparent' }}
          onClick={() => setActiveTab('smartmoney')}
        >
          SMART MONEY
        </button>
        <button
          className={`tab ${activeTab === 'feed' ? 'active' : ''}`}
          style={{ borderBottomColor: activeTab === 'feed' ? narrative.color : 'transparent' }}
          onClick={() => setActiveTab('feed')}
        >
          LIVE FEED
        </button>
      </div>

      {activeTab === 'tokens' && (
        <div className="detail-scroll">
          <table className="token-table">
            <thead>
              <tr>
                <th>TOKEN</th>
                <th>PRICE</th>
                <th>CHG</th>
                <th>VOLUME</th>
                <th>BUY PRESS</th>
                <th>HOLDERS</th>
                <th>SECURITY</th>
              </tr>
            </thead>
            <tbody>
              {narrative.tokens.map((t) => (
                <React.Fragment key={t.address}>
                  <tr
                    onClick={() => setExpandedToken(expandedToken === t.address ? null : t.address)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="token-id">
                        <div className="logo" style={{ background: `${narrative.color}22`, color: narrative.color }}>
                          {t.logoURI ? <img alt="" src={t.logoURI} width="20" height="20" /> : t.symbol?.[0]}
                        </div>
                        <div>
                          <div>{t.symbol} {t.isNew && <span className="new-badge">NEW</span>}</div>
                          <div className="mono muted">SOL</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono">${formatPrice(t.price || 0)}</td>
                    <td className={`mono ${(t.priceChange24h || 0) >= 0 ? 'green' : 'red'}`}>
                      {(t.priceChange24h || 0) >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(t.priceChange24h || 0).toFixed(1)}%
                    </td>
                    <td className="mono">{formatVolume(t.volume24h)}</td>
                    <td className="mono">
                      <span className="pressure">
                        <span style={{ width: `${Math.round((t.buyPressure || 0.5) * 100)}%` }} />
                      </span>
                      {Math.round((t.buyPressure || 0.5) * 100)}%
                    </td>
                    <td className="mono">{formatHolders(t.holderCount)}</td>
                    <td><Risk risk={t.securityRisk} /></td>
                  </tr>
                  {expandedToken === t.address && (
                    <tr className="accordion">
                      <td colSpan="7">
                        <div className="token-detail">
                          <Sparkline data={t.sparkline} width={200} height={32} color={narrative.color} />
                          <span>Buy: {formatVolume(t.buyVolume)}</span>
                          <span>Sell: {formatVolume(t.sellVolume)}</span>
                          <span>🐋 {t.whaleCount || 0} whale buys/h</span>
                          <button
                            className="copy-btn"
                            onClick={(e) => { e.stopPropagation(); copy(t.address); }}
                          >
                            Copy address
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'smartmoney' && (
        <div className="detail-scroll wallet-grid">
          {wallets.map((w) => (
            <div className="wallet-card" key={w.wallet}>
              <div className="wallet-top">
                <span>{shortAddress(w.wallet)}</span>
                <span>Win Rate: {Math.round(w.winRate || 0)}% {w.winRate > 60 ? '\u2713' : ''}</span>
              </div>
              <div className={`wallet-line ${(w.realizedPnl || 0) >= 0 ? 'green' : 'red'}`}>
                Realized PnL: {(w.realizedPnl || 0) >= 0 ? '+' : ''}{formatVolume(w.realizedPnl || 0)}
              </div>
              <div className="wallet-line">Holds {1 + seededNumber(w.wallet, 4)} tokens in this narrative</div>
              <div className="wallet-line">Last active: {formatTime(w.lastActive || Date.now())}</div>
              <button className="copy-btn" style={{ marginTop: 12 }} onClick={() => copy(w.wallet)}>
                Copy wallet
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'feed' && <EventFeed events={events} />}
    </>
  );
}
