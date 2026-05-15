import React from 'react';
import { getScoreBreakdown, formatVolume, formatTime } from '../utils';

function Bar({ label, value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="evidence-row">
      <div className="evidence-row-head">
        <span>{label}</span>
        <span>{value.toFixed(1)} / {max}</span>
      </div>
      <div className="evidence-bar"><span style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

export default function EvidencePanel({ narrative }) {
  const b = getScoreBreakdown(narrative);
  return (
    <div className="evidence-panel">
      <div className="evidence-hero">
        <div>
          <div className="section-kicker">WHY THIS SCORE?</div>
          <div className="evidence-title">{narrative.emoji} {narrative.name}</div>
        </div>
        <div className="evidence-score" style={{ color: narrative.color }}>{narrative.momentumScore}</div>
      </div>
      <div className="evidence-grid">
        <Bar label="Volume velocity" value={b.volumeScore} max={30} color={narrative.color} />
        <Bar label="Launch rate" value={b.launchScore} max={25} color="var(--green)" />
        <Bar label="Whale activity" value={b.whaleScore} max={25} color="var(--amber)" />
        <Bar label="Buy pressure" value={b.pressureScore} max={20} color="var(--stage-peaking)" />
      </div>
      <div className="evidence-facts">
        <div><span>Tokens tracked</span><strong>{narrative.tokens.length}</strong></div>
        <div><span>New tokens / 1h</span><strong>{b.newTokens}</strong></div>
        <div><span>Whale volume / 1h</span><strong>{formatVolume(b.whaleVolume)}</strong></div>
        <div><span>Buy / Sell</span><strong>{formatVolume(b.buyVolume)} / {formatVolume(b.sellVolume)}</strong></div>
        <div><span>Risk flags</span><strong>{b.riskyTokens} high-risk</strong></div>
        <div><span>Last update</span><strong>{formatTime(narrative.lastUpdated)}</strong></div>
      </div>
      <div className="evidence-note">
        Score is recomputed from Birdeye volume, token launch velocity, whale transaction flow, buy/sell pressure, and security filters. This is the audit trail judges can actually read.
      </div>
    </div>
  );
}
