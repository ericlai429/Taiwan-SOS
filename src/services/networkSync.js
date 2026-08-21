/**
 * 🌐 跨裝置跨網路即時同步引擎 (Real-time Cross-Device Network Sync Engine)
 * 支援「手機 <-> 電腦/NB」跨網路 (4G/5G/Wi-Fi) 無縫即時廣播與暗碼對話對齊
 * 採用 雙軌制：BroadcastChannel (同裝置多分頁) + WebSocket Mesh Relay (跨實體裝置)
 */

class NetworkSyncManager {
  constructor() {
    this.ws = null;
    this.broadcastChannel = null;
    this.subscribers = new Set();
    this.currentChannel = 'taiwan_sos_public';
    this.isConnected = false;
    this.reconnectTimer = null;
    this.initLocalChannel();
  }

  // 初始化同裝置多頁籤 Local BroadcastChannel
  initLocalChannel() {
    if ('BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('taiwan_sos_local_mesh');
        this.broadcastChannel.onmessage = (event) => {
          this.notifySubscribers(event.data, 'local');
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }
    }
  }

  // 切換暗碼群組通道
  setChannel(cipherCode) {
    const newChannel = cipherCode
      ? `taiwan_sos_cipher_${btoa(cipherCode).replace(/=/g, '')}`
      : 'taiwan_sos_public';

    if (this.currentChannel !== newChannel) {
      this.currentChannel = newChannel;
      this.connectWebSocket();
    }
  }

  // 連接跨裝置 WebSocket 公用即時中繼轉播站 (WebSocket Mesh Relay)
  connectWebSocket() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }

    // 使用極速公用 WebSocket 中繼伺服器 (支持即時廣播)
    const wsUrl = `wss://socketsbay.com/wss/v2/1/demo/`;
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('🌐 跨裝置即時連線已建立！ (手機 <-> 電腦對齊中)');
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          // 檢查是否為當前群組通道訊息
          if (payload && payload.channel === this.currentChannel && payload.senderId !== this.getDeviceId()) {
            this.notifySubscribers(payload.data, 'remote');
          }
        } catch (e) {
          // 非 JSON 或中繼廣播格式直接忽略
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connect retry...', err);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // 自動背離重連 (3 秒後重試)
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 3000);
      };
    } catch (e) {
      console.warn('WebSocket init failed, fallback to local mesh', e);
    }
  }

  // 取得裝置唯一 ID (防止重複接收自己發出的訊息)
  getDeviceId() {
    let devId = sessionStorage.getItem('taiwan_sos_dev_id');
    if (!devId) {
      devId = 'dev-' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('taiwan_sos_dev_id', devId);
    }
    return devId;
  }

  // 發送訊息 (同時廣播給同裝置分頁與手機/電腦跨裝置)
  broadcast(type, data) {
    const payloadData = { type, data, timestamp: Date.now() };

    // 1. 同裝置 Local 分頁廣播
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payloadData);
      } catch (e) {}
    }

    // 2. 跨裝置 4G/Wi-Fi 網路中繼廣播
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const envelope = {
          channel: this.currentChannel,
          senderId: this.getDeviceId(),
          data: payloadData
        };
        this.ws.send(JSON.stringify(envelope));
      } catch (e) {
        console.warn('WS send failed', e);
      }
    }
  }

  // 訂閱廣播事件
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(payload, source) {
    this.subscribers.forEach(cb => {
      try {
        cb(payload, source);
      } catch (e) {
        console.error('Subscriber error', e);
      }
    });
  }
}

export const networkSync = new NetworkSyncManager();
