export const WS_URL = (apiKey) =>
  `wss://public-api.birdeye.so/socket/solana?x-api-key=${encodeURIComponent(apiKey)}`;

export class WebSocketManager {
  constructor({ getUrl, onStatus, onMessage }) {
    this.getUrl = getUrl;
    this.onStatus = onStatus;
    this.onMessage = onMessage;
    this.ws = null;
    this.connected = false;
    this.manualClose = false;
    this.subscriptions = new Map();
    this.queue = [];
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.useProtocol = true;
    this.protocolFallbackAttempted = false;
  }

  connect() {
    this.manualClose = false;
    this.cleanupSocket();
    this.onStatus('connecting');
    let opened = false;
    try {
      const url = this.getUrl();
      this.ws = this.useProtocol ? new WebSocket(url, 'echo-protocol') : new WebSocket(url);
      this.ws.onopen = () => {
        opened = true;
        this.connected = true;
        this.reconnectAttempts = 0;
        this.onStatus('live');
        this.startHeartbeat();
        [...this.subscriptions.values()].forEach((msg) => this.send(msg));
        const pending = [...this.queue];
        this.queue = [];
        pending.forEach((msg) => this.send(msg));
      };
      this.ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          this.onMessage(JSON.parse(event.data));
        } catch {
          this.onMessage(event.data);
        }
      };
      this.ws.onerror = () => this.onStatus('connecting');
      this.ws.onclose = () => {
        this.connected = false;
        this.stopHeartbeat();
        if (!opened && this.useProtocol && !this.protocolFallbackAttempted) {
          this.useProtocol = false;
          this.protocolFallbackAttempted = true;
          this.reconnectAttempts = 0;
          this.scheduleReconnect(0);
          return;
        }
        if (!this.manualClose) this.scheduleReconnect();
        else this.onStatus('disconnected');
      };
    } catch {
      if (this.useProtocol && !this.protocolFallbackAttempted) {
        this.useProtocol = false;
        this.protocolFallbackAttempted = true;
        this.reconnectAttempts = 0;
      }
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.manualClose = true;
    this.connected = false;
    clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    if (this.ws) this.ws.close();
    this.ws = null;
    this.onStatus('disconnected');
  }

  subscribe(key, message) {
    this.subscriptions.set(key, message);
    this.send(message);
  }

  unsubscribe(key) {
    const message = this.subscriptions.get(key);
    this.subscriptions.delete(key);
    if (message) this.send({ ...message, type: message.type?.replace('SUBSCRIBE', 'UNSUBSCRIBE') });
  }

  send(message) {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(message));
    else this.queue.push(message);
  }

  scheduleReconnect(delayOverride) {
    this.onStatus('connecting');
    const delay = delayOverride ?? Math.min(30000, 1000 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => this.send({ type: 'ping', ts: Date.now() }), 30000);
  }

  stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  cleanupSocket() {
    if (!this.ws) return;
    this.ws.onopen = null;
    this.ws.onmessage = null;
    this.ws.onerror = null;
    this.ws.onclose = null;
    try {
      this.ws.close();
    } catch {
      /* noop */
    }
  }
}
