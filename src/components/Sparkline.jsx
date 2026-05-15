import React from 'react';

export default function Sparkline({ data, width = 80, height = 24, color }) {
  if (!data || data.length < 2) return <span className="spark-empty" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(' ');
  const positive = data[data.length - 1] >= data[0];
  const lineColor = color || (positive ? 'var(--green)' : 'var(--red)');
  return (
    <svg width={width} height={height} className="spark">
      <polyline
        points={pts}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
