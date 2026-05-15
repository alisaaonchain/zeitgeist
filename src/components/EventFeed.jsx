import React from 'react';
import { NARRATIVES } from '../constants';
import { formatTime } from '../utils';

function colorFor(e) {
  if (e.type === 'WHALE_ENTRY') return 'var(--amber)';
  if (e.type === 'NEW_TOKEN') return 'var(--green)';
  if (e.type === 'ROTATION') return '#A78BFA';
  return NARRATIVES[e.narrativeId]?.color || 'var(--border-bright)';
}

export default function EventFeed({ events }) {
  return (
    <div className="feed-list">
      {events.map((e) => (
        <div className="event" key={e.id} style={{ borderLeftColor: colorFor(e) }}>
          <div className="event-top">
            <span style={{ color: colorFor(e) }}>{e.title || e.type}</span>
            <span>{formatTime(e.ts)}</span>
          </div>
          <div className="event-main">{e.main}</div>
          <div className="event-sub">{e.sub}</div>
        </div>
      ))}
    </div>
  );
}
