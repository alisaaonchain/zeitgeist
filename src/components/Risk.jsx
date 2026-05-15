import React from 'react';

export default function Risk({ risk = 'LOW' }) {
  const color = risk === 'HIGH' ? 'var(--red)' : risk === 'MEDIUM' ? 'var(--amber)' : 'var(--green)';
  return (
    <span className="risk">
      <span className="risk-dot" style={{ background: color }} />
      {risk}
    </span>
  );
}
