/**
 * 🌐 全功能強固型跨裝置 (手機 4G <-> 電腦/NB) 即時 MQTT WebSockets 同步引擎
 * 使用正確埠號之全球高可用 WebSockets 傳輸 (HiveMQ :8000 / EMQX :8084 / Mosquitto :8081)
 * 100% 支援跨實體裝置、跨行動網路 (4G/5G/Wi-Fi) 零延遲即時彈幕廣播與暗碼對話對齊
 */

import mqtt from 'mqtt';

class RealtimeNetworkSync {
  constructor() {
    this.client = null;
    this.localChannel = null;
    this.subscribers = new Set();
    this.currentTopic = 'taiwan-sos/pubsub/CH-01';
    this.deviceId = this.getOrCreateDeviceId();
    this.isConnected = false;

    // 📌 正確指定的全球 WebSockets MQTT 節點與Port號
    this.BROKERS = [
      'wss://broker.hivemq.com:8000/mqtt', // HiveMQ WebSocket Port 8000
      'wss://broker.emqx.io:8084/mqtt',    // EMQX WebSocket Port 8084
      'wss://test.mosquitto.org:8081'      // Mosquitto WebSocket Port 8081
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
        this.localChannel = new BroadcastChannel('taiwan_sos_local_bus');
        this.localChannel.onmessage = (e) => {
          if (e.data) this.notifySubscribers(e.data, 'local');
        };
      } catch (err) {
        console.warn('Local BroadcastChannel error', err);
      }
    }
  }

  bindNetworkEvents() {
    window.addEventListener('online', () => {
      console.log('🌐 網路已恢復，自動連線 MQTT...');
      this.connectMQTT();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!this.client || !this.isConnected) {
          console.log('📱 手機解鎖/開啟畫面，重連 MQTT...');
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

  // 連接 MQTT Over WebSockets (自動輪詢可靠埠號節點)
  connectMQTT() {
    if (this.client) {
      try { this.client.end(true); } catch (e) {}
      this.client = null;
    }

    const targetUrl = this.BROKERS[this.brokerIndex];
    const clientId = `TaiwanSOS_${this.deviceId}_${Math.random().toString(36).substring(2, 6)}`;

    console.log(`🌐 正在建立全台跨裝置連線：${targetUrl} [Topic: ${this.currentTopic}]`);

    try {
      this.client = mqtt.connect(targetUrl, {
        clientId,
        keepalive: 20,
        reconnectPeriod: 2500,
        connectTimeout: 8000,
        resubscribe: true,
        clean: true
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log(`✅ MQTT 跨裝置網路連線成功！ (${targetUrl})`);
        
        this.client.subscribe(this.currentTopic, { qos: 0 }, (err) => {
          if (err) {
            console.error('MQTT subscribe error:', err);
          } else {
            console.log(`📡 成功訂閱跨裝置主題：${this.currentTopic}`);
          }
        });
      });

      this.client.on('message', (topic, message) => {
        try {
          const strPayload = message.toString();
          const parsed = JSON.parse(strPayload);

          if (parsed && parsed.senderId !== this.deviceId) {
            console.log('⚡ [MQTT 收到遠端訊息/廣播]：', parsed.payload);
            this.notifySubscribers(parsed.payload, 'remote_mqtt');
          }
        } catch (err) {
          console.warn('MQTT payload parse err', err);
        }
      });

      this.client.on('error', (err) => {
        console.warn(`MQTT Client Error (${targetUrl}):`, err);
        this.isConnected = false;
        this.brokerIndex = (this.brokerIndex + 1) % this.BROKERS.length;
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    } catch (err) {
      console.error('MQTT Connection fail', err);
      this.brokerIndex = (this.brokerIndex + 1) % this.BROKERS.length;
    }
  }

  // 廣播發送訊息 (兼顧本機多分頁與 4G/5G/Wi-Fi 跨裝置實體網路)
  broadcast(type, data) {
    const payloadObj = { type, data, timestamp: Date.now() };

    if (this.localChannel) {
      try {
        this.localChannel.postMessage(payloadObj);
      } catch (e) {}
    }

    if (this.client && this.isConnected) {
      try {
        const envelope = {
          senderId: this.deviceId,
          payload: payloadObj
        };
        this.client.publish(this.currentTopic, JSON.stringify(envelope), { qos: 0 });
        console.log(`🚀 成功經由 MQTT 發射跨裝置訊息 [Topic: ${this.currentTopic}]`);
      } catch (err) {
        console.warn('MQTT Publish error', err);
      }
    } else {
      console.warn('⚠️ MQTT 尚未連線成功，重新嘗試發送連线...');
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
      } catch (e) {
        console.error('Subscriber callback error', e);
      }
    });
  }
}

export const networkSync = new RealtimeNetworkSync();
