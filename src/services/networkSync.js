/**
 * 🌐 全功能強固型跨裝置 (手機 4G <-> 電腦/NB) 即時 MQTT WebSockets 同步引擎
 * 使用統一標準 MQTT over WebSockets 叢集 (EMQX 8084 專用極速通道)
 * 100% 支援跨實體裝置、跨行動網路 (4G/5G/Wi-Fi) 零延遲即時彈幕廣播與暗碼對話對齊
 */

import mqtt from 'mqtt';

class RealtimeNetworkSync {
  constructor() {
    this.client = null;
    this.localChannel = null;
    this.subscribers = new Set();
    this.currentTopic = 'taiwan-sos/pubsub/public';
    this.deviceId = this.getOrCreateDeviceId();
    this.isConnected = false;
    this.brokerUrl = 'wss://broker.emqx.io:8084/mqtt'; // 📌 統一全台固定主要 MQTT 叢集，嚴禁隨機亂跑

    // 初始化同裝置多分頁極速 Local Channel
    this.initLocalChannel();
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

  // 設定並切換暗碼頻道 (MQTT Topic)
  setChannel(cipherCode) {
    const rawCode = cipherCode ? cipherCode.trim() : 'public';
    // 將暗碼作簡單 Safe Topic 轉換
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

  // 連接高可用性公用 MQTT Over WebSockets 叢集 (EMQX Primary / HiveMQ Backup)
  connectMQTT(useBackup = false) {
    if (this.client) {
      try { this.client.end(true); } catch (e) {}
      this.client = null;
    }

    const primaryBroker = 'wss://broker.emqx.io:8084/mqtt';
    const backupBroker = 'wss://broker.hivemq.com:8884/mqtt';
    const targetUrl = useBackup ? backupBroker : primaryBroker;
    this.brokerUrl = targetUrl;

    const clientId = `TaiwanSOS_${this.deviceId}_${Math.random().toString(36).substring(2, 6)}`;

    console.log(`🌐 正在建立全台統一跨裝置連線：${targetUrl} [Topic: ${this.currentTopic}]`);

    try {
      this.client = mqtt.connect(targetUrl, {
        clientId,
        keepalive: 30,
        reconnectPeriod: 2000,
        connectTimeout: 8000,
        resubscribe: true,
        clean: true
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ MQTT 跨裝置網路連線成功！ (手機 <-> 電腦連通於同一個 Broker)');
        
        // 訂閱當前頻道 Topic
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

          // 濾掉自己發出的訊息 (避免重複)
          if (parsed && parsed.senderId !== this.deviceId) {
            console.log('⚡ 收到遠端跨裝置訊息/廣播：', parsed.payload);
            this.notifySubscribers(parsed.payload, 'remote_mqtt');
          }
        } catch (err) {
          console.warn('MQTT payload parse err', err);
        }
      });

      this.client.on('error', (err) => {
        console.warn('MQTT Client Error:', err);
        if (!useBackup) {
          console.log('🔄 主要 EMQX 節點連線受阻，嘗試切換備用 HiveMQ 節點...');
          setTimeout(() => this.connectMQTT(true), 2000);
        }
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    } catch (err) {
      console.error('MQTT Connection fail', err);
    }
  }

  // 廣播發送訊息 (兼顧本機多分頁與 4G/Wi-Fi 跨裝置實體網路)
  broadcast(type, data) {
    const payloadObj = { type, data, timestamp: Date.now() };

    // 1. 同裝置 Local 分頁極速廣播
    if (this.localChannel) {
      try {
        this.localChannel.postMessage(payloadObj);
      } catch (e) {}
    }

    // 2. 實體跨裝置 MQTT WebSockets 全球網路廣播
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
      console.warn('⚠️ MQTT 未連線，訊息無法發送至遠端實體裝置');
    }
  }

  // 訂閱事件
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
