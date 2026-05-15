const BIRDEYE_API = 'https://public-api.birdeye.so';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function sanitizePath(path) {
  if (!path || typeof path !== 'string' || !path.startsWith('/')) return null;
  if (path.startsWith('//') || path.includes('://')) return null;
  return path;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: 'BIRDEYE_API_KEY is not configured' });
    return;
  }

  const rawPath = Array.isArray(req.query.path) ? req.query.path[0] : req.query.path;
  const path = sanitizePath(rawPath);
  if (!path) {
    sendJson(res, 400, { error: 'Missing or invalid path' });
    return;
  }

  try {
    const upstream = await fetch(`${BIRDEYE_API}${path}`, {
      headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' },
    });
    const contentType = upstream.headers.get('content-type') || 'application/json';
    const body = await upstream.text();
    setCors(res);
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', contentType);
    res.end(body);
  } catch {
    sendJson(res, 502, { error: 'Birdeye proxy request failed' });
  }
}
