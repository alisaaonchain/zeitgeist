import { NARRATIVE_KEYWORDS } from '../constants';

export function classifyToken(token) {
  const text = `${token?.name || ''} ${token?.symbol || ''}`.toLowerCase();
  const scores = {};
  for (const [id, keywords] of Object.entries(NARRATIVE_KEYWORDS)) {
    scores[id] = keywords.filter((kw) => text.includes(kw)).length;
  }
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return top[1] > 0 ? top[0] : 'MEME';
}
