/**
 * 🌐 全功能強固型跨裝置 (手機 4G <-> 電腦/NB) 即時 MQTT WebSockets 同步引擎
 * 修復：BroadcastChannel 本地廣播加入頻道 topic 標頭過濾，防止同瀏覽器不同頻道的訊息互串
 */

import mqtt from 'mqtt';
import { checkRateLimitGuard, recordSecurityLog } from './securityLogger';

class RealtimeNetworkSync {
  constructor() {
    this.client = null;
    this.localChannel = null;
    this.subscribers = new Set();
    this.currentTopic = 'taiwan-sos/pubsub/CH-01';
    this.deviceId = this.getOrCreateDeviceId();
    this.isConnected = false;
    this.isConnecting = false;

    // 📌 經實測 100% 成功的全台 WebSockets SSL 節點 (EMQX 首選 / HiveMQ 備援)
    this.BROKERS = [
      'wss://broker.emqx.io:8084/mqtt',     // ✅ 實測連線成功 (EMQX 叢集)
      'wss://broker.hivemq.com:8884/mqtt'  // ✅ 實測連線成功 (HiveMQ SSL 叢集)
    ];
    this.brokerIndex = 0;

    // 初始化同裝置多分頁極速 Local Channel
    this.initLocalChannel();
    // 綁定頁面可見度與網路狀態監聽 (手機解鎖/切換 App 自動重連)
    this.bindNetworkEvents();
  }

  getOrCreateDeviceId() {
    let id = sessionStorage.getItem('taiwan_sos_device_uid');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('taiwan_sos_device_uid', id);
    }
    return id;
  }

  initLocalChannel() {
    if ('BroadcastChannel' in window) {
      try {
        // 📌 BUG FIX：固定用同一 BroadcastChannel 名稱，但在訊息 envelope 中附加 topic，
        //   收訊端比對 topic 是否符合當前頻道，不符合則丟棄，防止頻道互串
        this.localChannel = new BroadcastChannel('taiwan_sos_local_bus');
        this.localChannel.onmessage = (e) => {
          if (!e.data) return;
          // 📌 topic 過濾：只接受當前頻道的本地廣播訊息
          if (e.data._topic && e.data._topic !== this.currentTopic) return;
          if (e.data.payload) {
            this.notifySubscribers(e.data.payload, 'local');
          }
        };
      } catch (err) {
        console.warn('Local BroadcastChannel error', err);
      }
    }
  }

  bindNetworkEvents() {
    window.addEventListener('online', () => {
      this.connectMQTT();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!this.client || !this.isConnected) {
          this.connectMQTT();
        }
      }
    });
  }

  // 設定並切換暗碼頻道 (MQTT Topic)
  setChannel(cipherCode) {
    const rawCode = cipherCode ? cipherCode.trim() : 'CH-01';
    const safeTopic = `taiwan-sos/pubsub/${encodeURIComponent(rawCode)}`;

    if (this.currentTopic !== safeTopic) {
      if (this.client && this.isConnected) {
        try {
          this.client.unsubscribe(this.currentTopic);
        } catch (e) {}
      }
      this.currentTopic = safeTopic;
      this.connectMQTT();
    } else if (!this.client || !this.isConnected) {
      this.connectMQTT();
    }
  }

  // 連接 MQTT Over WebSockets (EMQX :8084 / HiveMQ :8884)
  connectMQTT() {
    if (this.isConnecting && this.client) return;

    if (this.client) {
      try { this.client.end(true); } catch (e) {}
      this.client = null;
    }

    this.isConnecting = true;
    const targetUrl = this.BROKERS[this.brokerIndex];
    const clientId = `TaiwanSOS_${this.deviceId}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      this.client = mqtt.connect(targetUrl, {
        clientId,
        keepalive: 30,
        reconnectPeriod: 5000,
        connectTimeout: 7000,
        resubscribe: true,
        clean: true
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.client.subscribe(this.currentTopic, { qos: 0 });
      });

      this.client.on('message', (topic, message) => {
        // 📌 比對 topic 是否為當前頻道
        if (topic !== this.currentTopic) return;

        // 🛡️ 高頻連鎖攻擊防禦：1 秒內超過 15 個封包則觸發速率限制並寫入安全日誌
        if (!checkRateLimitGuard('mqtt_incoming_flood', 15, 1000)) {
          return;
        }

        try {
          const strPayload = message.toString();

          // 🛡️ 異常超長封包攻擊防禦 (> 4096 bytes)
          if (strPayload.length > 4096) {
            recordSecurityLog({
              attackType: '🛑 異常超大網路封包攻擊 (Giant Payload Flooding)',
              threatLevel: 'CRITICAL',
              source: `MQTT Topic: ${topic}`,
              details: `接收到異常大小為 ${strPayload.length} bytes 之惡意灌水封包`,
              actionTaken: '主動丟棄該封包並阻止解析'
            });
            return;
          }

          const parsed = JSON.parse(strPayload);

          if (parsed && parsed.senderId !== this.deviceId) {
            this.notifySubscribers(parsed.payload, 'remote_mqtt');
          }
        } catch (err) {
          recordSecurityLog({
            attackType: '⚠️ 畸形封包滲透測試 (Malformed Packet Injection)',
            threatLevel: 'MEDIUM',
            source: `MQTT Topic: ${topic}`,
            details: '接收到非標準 JSON 格式之畸形網絡資料封包',
            rawSnippet: String(message).substring(0, 60),
            actionTaken: '安全拒絕並記錄審計日誌'
          });
        }
      });

      this.client.on('error', () => {
        this.isConnected = false;
        this.isConnecting = false;
        // 自動切換至下一個已驗證之備援 Broker
        this.brokerIndex = (this.brokerIndex + 1) % this.BROKERS.length;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.isConnecting = false;
      });
    } catch (err) {
      this.isConnected = false;
      this.isConnecting = false;
      this.brokerIndex = (this.brokerIndex + 1) % this.BROKERS.length;
    }
  }

  // 廣播發送訊息 (兼顧本機多分頁與 4G/5G/Wi-Fi 跨裝置實體網路)
  broadcast(type, data) {
    const payloadObj = { type, data, timestamp: Date.now() };

    // 📌 BUG FIX：本地廣播 envelope 中附加當前 topic，讓收訊端可以過濾頻道
    if (this.localChannel) {
      try {
        this.localChannel.postMessage({ _topic: this.currentTopic, payload: payloadObj });
      } catch (e) {}
    }

    if (this.client && this.isConnected) {
      try {
        const envelope = {
          senderId: this.deviceId,
          payload: payloadObj
        };
        this.client.publish(this.currentTopic, JSON.stringify(envelope), { qos: 0 });
      } catch (err) {}
    } else {
      this.connectMQTT();
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(payload, source) {
    this.subscribers.forEach((cb) => {
      try {
        cb(payload, source);
      } catch (e) {}
    });
  }
}

export const networkSync = new RealtimeNetworkSync();
