import React from 'react';

export default function LoadingScreen({ initSteps, initProgress }) {
  const current = Math.max(0, initSteps.findIndex((s) => !s.done));
  return (
    <div className="loading">
      <div className="loading-card">
        <div className="radar loading-logo" />
        <div className="loading-title">Zeitgeist</div>
        <div className="loading-sub">Mapping Solana's narratives...</div>
        <div className="steps">
          {initSteps.map((s, i) => (
            <div key={s.label} className={`step ${s.done ? 'done' : ''} ${i === current ? 'current' : ''}`}>
              {s.done ? '\u2713' : i === current ? '\u27F3' : ' '} {s.label}
            </div>
          ))}
        </div>
        <div className="progress">
          <span style={{ width: `${initProgress}%` }} />
        </div>
      </div>
    </div>
  );
}
