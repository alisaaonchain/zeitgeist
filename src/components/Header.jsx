import React from 'react';
import { formatVolume } from '../utils';

export default function Header({
  wsStatus,
  totalStats,
  apiKey,
  setApiKey,
  apiInputRef,
  onConnect,
}) {
  return (
    <div className="zg-header">
      <div className="radar" />
      <div className="brand">Zeitgeist</div>
      <div className="status">
        <span className={`status-dot ${wsStatus}`} />
        {wsStatus === 'live' ? 'LIVE' : wsStatus.toUpperCase()}
      </div>
      <div className="header-stats">
        5 streams &middot; {totalStats.narratives} narratives &middot; {formatVolume(totalStats.volume)}
      </div>
      <div className="spacer" />
      <input
        ref={apiInputRef}
        className="api-input"
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="API KEY \u2022\u2022\u2022\u2022"
      />
      <button className="connect-btn" onClick={onConnect}>
        Connect
      </button>
    </div>
  );
}
