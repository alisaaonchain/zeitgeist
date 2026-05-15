import React from 'react';
import { STAGE_CONFIG } from '../constants';
import { formatHolders, formatVolume } from '../utils';

export default function NarrativeTable({ narratives, onSelect }) {
  return (
    <div className="detail-scroll">
      <table className="list-table">
        <thead>
          <tr>
            <th>NARRATIVE</th>
            <th>SCORE</th>
            <th>STAGE</th>
            <th>TOKENS</th>
            <th>HOLDERS</th>
            <th>VOLUME</th>
            <th>BUY PRESS</th>
          </tr>
        </thead>
        <tbody>
          {narratives.map((n) => (
            <tr key={n.id} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer' }}>
              <td>
                <span style={{ color: n.color }}>{n.emoji}</span> {n.name}
              </td>
              <td className="mono" style={{ color: n.color }}>{n.momentumScore}</td>
              <td className="mono">{STAGE_CONFIG[n.stage].emoji} {n.stage}</td>
              <td className="mono">{n.tokens.length}</td>
              <td className="mono">{formatHolders(n.totalHolders)}</td>
              <td className="mono">{formatVolume(n.totalVolume24h)}</td>
              <td className="mono">{Math.round(n.totalBuyPressure * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
