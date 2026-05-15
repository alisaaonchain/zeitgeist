import { STAGE_CONFIG } from '../constants';
import { formatHolders, formatVolume } from './formatting';
import { getAlphaCall } from './scoreBreakdown';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPill(ctx, text, x, y, color) {
  ctx.font = '700 22px DM Mono, monospace';
  const width = ctx.measureText(text).width + 34;
  roundRect(ctx, x, y, width, 42, 8);
  ctx.fillStyle = `${color}22`;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillText(text, x + 17, y + 28);
  return width;
}

export function exportAlphaCard(narrative) {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 675;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const color = narrative.color || '#60A5FA';
  const stage = STAGE_CONFIG[narrative.stage];
  const alphaCall = getAlphaCall(narrative);
  const topTokens = [...(narrative.tokens || [])]
    .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
    .slice(0, 3);
  const whales = (narrative.whaleTrades || []).filter((trade) => Date.now() - trade.timestamp < 3600000).length;

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#030308');
  bg.addColorStop(0.55, '#070710');
  bg.addColorStop(1, '#111124');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(310, 170, 20, 310, 170, 540);
  glow.addColorStop(0, `${color}55`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let x = 80; x < width; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 80; y < height; y += 96) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#F2F2FF';
  ctx.font = '700 28px DM Sans, sans-serif';
  ctx.fillText('◎ ZEITGEIST', 72, 78);
  ctx.font = '500 18px DM Mono, monospace';
  ctx.fillStyle = '#7A7A9A';
  ctx.fillText('Solana On-Chain Narrative Intelligence', 72, 112);

  ctx.font = '120px serif';
  ctx.fillText(narrative.emoji, 76, 255);
  ctx.fillStyle = '#F2F2FF';
  ctx.font = '700 66px DM Sans, sans-serif';
  ctx.fillText(narrative.name, 190, 220);
  drawPill(ctx, alphaCall, 192, 250, color);
  drawPill(ctx, narrative.stage, 192 + ctx.measureText(alphaCall).width + 70, 250, stage?.rawColor || color);

  ctx.font = '700 120px DM Mono, monospace';
  ctx.fillStyle = color;
  ctx.fillText(String(narrative.momentumScore).padStart(2, '0'), 812, 210);
  ctx.font = '500 18px DM Mono, monospace';
  ctx.fillStyle = '#7A7A9A';
  ctx.fillText('MOMENTUM SCORE', 820, 242);

  const metrics = [
    ['TOKENS', String(narrative.tokens?.length || 0)],
    ['HOLDERS', formatHolders(narrative.totalHolders || 0)],
    ['24H VOLUME', formatVolume(narrative.totalVolume24h || 0)],
    ['BUY PRESSURE', `${Math.round((narrative.totalBuyPressure || 0) * 100)}%`],
    ['WHALES/H', String(whales)],
    ['NEW/H', String(narrative.newTokensLastHour || 0)],
  ];
  metrics.forEach(([label, value], i) => {
    const x = 76 + (i % 3) * 350;
    const y = 356 + Math.floor(i / 3) * 112;
    roundRect(ctx, x, y, 300, 76, 8);
    ctx.fillStyle = 'rgba(12,12,28,0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.stroke();
    ctx.fillStyle = '#7A7A9A';
    ctx.font = '500 16px DM Mono, monospace';
    ctx.fillText(label, x + 18, y + 26);
    ctx.fillStyle = '#F2F2FF';
    ctx.font = '700 28px DM Mono, monospace';
    ctx.fillText(value, x + 18, y + 58);
  });

  ctx.fillStyle = '#7A7A9A';
  ctx.font = '500 16px DM Mono, monospace';
  ctx.fillText('TOP TOKENS', 76, 610);
  topTokens.forEach((token, i) => {
    ctx.fillStyle = i === 0 ? color : '#F2F2FF';
    ctx.font = '700 24px DM Sans, sans-serif';
    ctx.fillText(`${i + 1}. ${token.symbol}`, 210 + i * 230, 610);
    ctx.fillStyle = '#7A7A9A';
    ctx.font = '500 14px DM Mono, monospace';
    ctx.fillText(formatVolume(token.volume24h || 0), 210 + i * 230, 637);
  });

  ctx.fillStyle = '#3E3E58';
  ctx.font = '500 14px DM Mono, monospace';
  ctx.fillText('Generated from live Birdeye Data streams + Zeitgeist narrative scoring', 72, 650);

  const a = document.createElement('a');
  a.download = `zeitgeist-${narrative.id.toLowerCase()}-alpha-card.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}
