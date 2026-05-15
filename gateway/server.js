import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.BIRDEYE_API_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const BIRDEYE_API = 'https://public-api.birdeye.so';
const BIRDEYE_WS = () => `wss://public-api.birdeye.so/socket/solana?x-api-key=${encodeURIComponent(API_KEY || '')}`;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...corsHeaders() });
  res.end(JSON.stringify(payload));
}

function sanitizePath(path) {
  if (!path || typeof path !== 'string' || !path.startsWith('/')) return null;
  if (path.startsWith('//') || path.includes('://')) return null;
  return path;
}

async function proxyBirdeye(req, res, url) {
  if (!API_KEY) return sendJson(res, 500, { error: 'BIRDEYE_API_KEY is not configured' });
  const path = sanitizePath(url.searchParams.get('path'));
  if (!path) return sendJson(res, 400, { error: 'Missing or invalid path' });

  try {
    const upstream = await fetch(`${BIRDEYE_API}${path}`, {
      headers: { 'X-API-KEY': API_KEY, 'x-chain': 'solana' },
    });
    const contentType = upstream.headers.get('content-type') || 'application/json';
    const body = await upstream.text();
    res.writeHead(upstream.status, { 'Content-Type': contentType, ...corsHeaders() });
    res.end(body);
  } catch {
    sendJson(res, 502, { error: 'Birdeye proxy request failed' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }
  if (url.pathname === '/health') return sendJson(res, API_KEY ? 200 : 500, { ok: Boolean(API_KEY) });
  if (url.pathname === '/api/birdeye') return proxyBirdeye(req, res, url);
  sendJson(res, 404, { error: 'Not found' });
});

const wss = new WebSocketServer({ noServer: true, handleProtocols: (protocols) => protocols.has('echo-protocol') ? 'echo-protocol' : false });

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== '/ws') return socket.destroy();
  if (!API_KEY) return socket.destroy();
  wss.handleUpgrade(req, socket, head, (client) => wss.emit('connection', client));
});

wss.on('connection', (client) => {
  const queued = [];
  let upstream;
  let opened = false;

  const connectUpstream = (withProtocol = true) => {
    upstream = withProtocol ? new WebSocket(BIRDEYE_WS(), 'echo-protocol') : new WebSocket(BIRDEYE_WS());
    upstream.on('open', () => {
      opened = true;
      while (queued.length && upstream.readyState === WebSocket.OPEN) upstream.send(queued.shift());
    });
    upstream.on('message', (message) => {
      if (client.readyState === WebSocket.OPEN) client.send(message.toString());
    });
    upstream.on('close', () => {
      if (client.readyState === WebSocket.OPEN) client.close();
    });
    upstream.on('error', () => {
      if (!opened && withProtocol) connectUpstream(false);
      else if (client.readyState === WebSocket.OPEN) client.close();
    });
  };

  connectUpstream(true);

  client.on('message', (message) => {
    if (upstream?.readyState === WebSocket.OPEN) upstream.send(message.toString());
    else queued.push(message.toString());
  });
  client.on('close', () => {
    if (upstream?.readyState === WebSocket.OPEN || upstream?.readyState === WebSocket.CONNECTING) upstream.close();
  });
});

server.listen(PORT, () => {
  console.log(`Zeitgeist data gateway listening on ${PORT}`);
});
