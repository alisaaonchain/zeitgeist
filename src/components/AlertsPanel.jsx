import React from 'react';
import { formatTime } from '../utils';

export default function AlertsPanel({ rules, setRules, alerts }) {
  return (
    <div className="alerts-panel">
      <div className="panel-head compact"><span>WATCHLIST ALERTS</span><span>{alerts.length}</span></div>
      <div className="alert-rules">
        {rules.map((rule) => (
          <label key={rule.id} className="alert-rule">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={() => setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
            />
            <span>{rule.label}</span>
          </label>
        ))}
      </div>
      <div className="alert-list">
        {alerts.slice(0, 5).map((alert) => (
          <div className="alert-item" key={alert.id}>
            <div className="alert-title">{alert.title}<span>{formatTime(alert.ts)}</span></div>
            <div className="alert-body">{alert.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
