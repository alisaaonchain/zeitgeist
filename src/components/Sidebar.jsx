import React from 'react';
import { STAGE_CONFIG } from '../constants';
import { formatHolders, formatVolume } from '../utils';

export default function Sidebar({
  sortedNarratives,
  selectedNarrative,
  stageFlash,
  onSelect,
}) {
  return (
    <aside className="left-panel">
      <div className="panel-head">
        <span>NARRATIVES</span>
        <span>{sortedNarratives.length}</span>
      </div>
      <div className="narrative-list">
        {sortedNarratives.map((n) => (
          <div
            key={n.id}
            className={`narrative-row ${selectedNarrative === n.id ? 'selected' : ''} ${stageFlash === n.id ? 'flash' : ''}`}
            style={{ borderLeftColor: selectedNarrative === n.id ? n.color : 'transparent' }}
            onClick={() => onSelect(n.id)}
          >
            <div className="row-top">
              <span className="color-dot" style={{ background: n.color }} />
              <span className="row-name">{n.name}</span>
              <span className="row-score" style={{ color: n.color }}>{n.momentumScore}</span>
              <span>{STAGE_CONFIG[n.stage].emoji}</span>
            </div>
            <div className="score-bar">
              <div className="score-fill" style={{ width: `${n.momentumScore}%`, background: n.color }} />
            </div>
            <div className="row-sub">
              {n.tokens.length} tokens &middot; {formatHolders(n.totalHolders)} holders &middot; {formatVolume(n.totalVolume24h)}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
