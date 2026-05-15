import React, { useMemo } from 'react';
import { NARRATIVES } from '../constants';
import { computeRotationFlows, formatVolume } from '../utils';

export default function RotationView({ narratives, events, onSelect }) {
  const flows = useMemo(() => computeRotationFlows(narratives, events), [narratives, events]);
  const ids = Object.keys(NARRATIVES);
  const nodes = ids.map((id, i) => {
    const angle = (i / ids.length) * Math.PI * 2 - Math.PI / 2;
    return {
      ...NARRATIVES[id],
      x: 50 + Math.cos(angle) * 34,
      y: 50 + Math.sin(angle) * 34,
      score: narratives[id]?.momentumScore || 0,
    };
  });
  const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));

  return (
    <div className="rotation-wrap">
      <div className="rotation-copy">
        <div className="section-kicker">CAPITAL ROTATION</div>
        <div className="rotation-title">Where Solana money is moving before social catches up</div>
      </div>
      <svg className="rotation-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L7,3 z" fill="#A78BFA" />
          </marker>
        </defs>
        {flows.map((flow) => {
          const from = nodeMap[flow.from];
          const to = nodeMap[flow.to];
          if (!from || !to) return null;
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2 - 10;
          return (
            <g key={`${flow.from}-${flow.to}`} className="rotation-flow">
              <path
                d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
                fill="none"
                stroke={to.color}
                strokeWidth={Math.max(0.5, Math.min(3.5, flow.strength / 16))}
                strokeOpacity="0.55"
                markerEnd="url(#arrow)"
              />
              <text x={mx} y={my - 1} textAnchor="middle" fill="rgba(255,255,255,.72)" fontSize="2.4" fontFamily="DM Mono">
                {flow.from} → {flow.to} · {formatVolume(flow.volume)}
              </text>
            </g>
          );
        })}
        {nodes.map((node) => (
          <g key={node.id} onClick={() => onSelect(node.id)} className="rotation-node">
            <circle cx={node.x} cy={node.y} r={6 + node.score / 18} fill={`${node.color}33`} stroke={node.color} strokeWidth="0.45" />
            <text x={node.x} y={node.y - 1} textAnchor="middle" fontSize="5" style={{ pointerEvents: 'none' }}>{node.emoji}</text>
            <text x={node.x} y={node.y + 5.5} textAnchor="middle" fill="white" fontSize="2.3" fontFamily="DM Sans" fontWeight="600" style={{ pointerEvents: 'none' }}>{node.id}</text>
          </g>
        ))}
      </svg>
      <div className="rotation-legend">
        {flows.slice(0, 4).map((flow) => <div key={`${flow.from}-${flow.to}`}><span>{flow.from} → {flow.to}</span><strong>{formatVolume(flow.volume)}</strong></div>)}
      </div>
    </div>
  );
}
