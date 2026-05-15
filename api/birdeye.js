const BIRDEYE_API = 'https://public-api.birdeye.so';

function getAllowedOrigins(req) {
  const configured = (process.env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || (host?.startsWith('localhost') || host?.startsWith('127.') ? 'http' : 'https');
  const sameOrigin = host ? `${protocol}://${host}` : null;
  const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  return new Set([sameOrigin, vercelOrigin, ...configured].filter(Boolean));
}

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && getAllowedOrigins(req).has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin;
  return !origin || getAllowedOrigins(req).has(origin);
}

function sendJson(req, res, status, payload) {
  setCors(req, res);
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
  setCors(req, res);

  if (!isAllowedOrigin(req)) {
    sendJson(req, res, 403, { error: 'Origin not allowed' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(req, res, 405, { error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey) {
    sendJson(req, res, 500, { error: 'BIRDEYE_API_KEY is not configured' });
    return;
  }

  const rawPath = Array.isArray(req.query.path) ? req.query.path[0] : req.query.path;
  const path = sanitizePath(rawPath);
  if (!path) {
    sendJson(req, res, 400, { error: 'Missing or invalid path' });
    return;
  }

  try {
    const upstream = await fetch(`${BIRDEYE_API}${path}`, {
      headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana' },
    });
    const contentType = upstream.headers.get('content-type') || 'application/json';
    const body = await upstream.text();
    setCors(req, res);
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', contentType);
    res.end(body);
  } catch {
    sendJson(req, res, 502, { error: 'Birdeye proxy request failed' });
  }
}
