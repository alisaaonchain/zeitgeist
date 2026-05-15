import React from 'react';
import { formatTime } from '../utils';

const statusLabel = {
  ok: 'OK',
  live: 'LIVE',
  pending: 'PENDING',
  error: 'ERROR',
  fallback: 'FALLBACK',
  limited: '429',
};

export default function DataHealth({ health }) {
  const rest = Object.entries(health.rest || {});
  const ws = Object.entries(health.ws || {});
  return (
    <div className="health-panel">
      <div className="panel-head compact"><span>DATA HEALTH</span><span>{rest.length + ws.length} surfaces</span></div>
      <div className="health-section">
        <div className="section-kicker">REST</div>
        {rest.map(([key, item]) => <HealthRow key={key} name={key} item={item} />)}
      </div>
      <div className="health-section">
        <div className="section-kicker">WEBSOCKET</div>
        {ws.map(([key, item]) => <HealthRow key={key} name={key} item={item} />)}
      </div>
    </div>
  );
}

function HealthRow({ name, item }) {
  const status = item.status || 'pending';
  return (
    <div className={`health-row ${status}`}>
      <span className="health-name">{name}</span>
      <span className="health-meta">{item.count ? `${item.count} ev · ` : ''}{item.updatedAt ? formatTime(item.updatedAt) : 'not yet'}</span>
      <span className="health-status">{statusLabel[status] || status}</span>
    </div>
  );
}
