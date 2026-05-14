import React from 'react';
import { STAGE_CONFIG } from '../constants';
import { formatHolders, formatVolume } from '../utils';

export default function BubbleMap({
  bubbles,
  containerSize,
  bubbleContainerRef,
  selectedNarrative,
  hoveredBubble,
  setSelectedNarrative,
  setHoveredBubble,
}) {
  return (
    <div className="bubble-wrap" ref={bubbleContainerRef}>
      <svg width={containerSize.width} height={containerSize.height}>
        <defs>
          {bubbles.map((b) => (
            <radialGradient key={b.id} id={`grad-${b.id}`} cx="40%" cy="35%">
              <stop offset="0%" stopColor={b.color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={b.color} stopOpacity="0.25" />
            </radialGradient>
          ))}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {bubbles.map((b) => (
          <g
            key={b.id}
            onClick={() => setSelectedNarrative(b.id)}
            onMouseMove={(e) => setHoveredBubble({ ...b, x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setHoveredBubble(null)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={b.x} cy={b.y}
              r={b.radius + b.glowIntensity}
              fill="none" stroke={b.color} strokeWidth="1" opacity="0.15"
              style={{ animation: `pulse-ring ${b.pulseSpeed} ease-in-out infinite` }}
            />
            <circle
              cx={b.x} cy={b.y}
              r={b.radius}
              fill={`url(#grad-${b.id})`}
              stroke={b.color}
              strokeWidth={selectedNarrative === b.id ? '2' : '0.5'}
              strokeOpacity="0.6"
              opacity={b.opacity}
              filter={b.glowIntensity > 16 ? 'url(#glow)' : undefined}
              style={{ transition: 'r 800ms ease, opacity 600ms ease, fill 600ms ease' }}
            />
            <text x={b.x} y={b.y - 10} textAnchor="middle" fontSize={b.radius * 0.4} style={{ pointerEvents: 'none' }}>
              {b.emoji}
            </text>
            <text x={b.x} y={b.y + 12} textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="'DM Sans', sans-serif" opacity="0.9" style={{ pointerEvents: 'none' }}>
              {b.label}
            </text>
            <text x={b.x} y={b.y + 26} textAnchor="middle" fill={b.color} fontSize="10" fontFamily="'DM Mono', monospace" style={{ pointerEvents: 'none' }}>
              {b.score}
            </text>
            <text x={b.x} y={b.y + b.radius + 16} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="'DM Mono', monospace" style={{ pointerEvents: 'none' }}>
              {formatHolders(b.totalHolders)} holders
            </text>
            <foreignObject x={b.x - 32} y={b.y - b.radius - 22} width="64" height="18">
              <div
                className="bubble-stage"
                style={{
                  background: STAGE_CONFIG[b.stage].bg,
                  border: `1px solid ${STAGE_CONFIG[b.stage].rawColor}`,
                  color: STAGE_CONFIG[b.stage].rawColor,
                }}
              >
                {b.stage}
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
      {hoveredBubble && (
        <div className="bubble-tooltip" style={{ left: hoveredBubble.x + 16, top: hoveredBubble.y - 132 }}>
          <div className="tip-title">{hoveredBubble.emoji} {hoveredBubble.label}</div>
          <div className="tip-line">Score: {hoveredBubble.score} &middot; {hoveredBubble.stage} {STAGE_CONFIG[hoveredBubble.stage].emoji}</div>
          <div className="tip-line">{hoveredBubble.tokenCount} tokens &middot; {formatHolders(hoveredBubble.totalHolders)} holders</div>
          <div className="tip-line">{formatVolume(hoveredBubble.totalVolume24h)} volume &middot; {hoveredBubble.whaleCount} 🐋/h</div>
          <div className="tip-line">Buy pressure: {Math.round(hoveredBubble.totalBuyPressure * 100)}%</div>
        </div>
      )}
    </div>
  );
}
