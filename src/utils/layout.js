export function computeBubbleLayout(bubbles, containerWidth, containerHeight) {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const count = bubbles.length || 1;
  const orbit = Math.max(120, Math.min(containerWidth, containerHeight) * 0.32);
  return bubbles.map((b, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const wobble = i % 2 ? 0.82 : 1.08;
    const x = Math.max(b.radius + 45, Math.min(containerWidth - b.radius - 45, centerX + Math.cos(angle) * orbit * wobble));
    const y = Math.max(b.radius + 50, Math.min(containerHeight - b.radius - 35, centerY + Math.sin(angle) * orbit * wobble));
    return { ...b, x, y };
  });
}
