/**
 * LocalStorage / 離線資料持久化與快取重置管理
 * 修復：每個頻道 (cipherCode) 使用獨立的訊息 key，防止跨頻道訊息互串
 */

const KEYS = {
  CIPHER_CODE: 'taiwan_safe_cipher_code',
  DANGER_FLAGS: 'taiwan_safe_danger_flags',
  HAZARD_ZONES: 'taiwan_safe_hazard_zones',
  DAILY_INTEL: 'taiwan_safe_daily_intel',
  HEARTBEATS: 'taiwan_safe_heartbeats',
  DAY_TIME_LOG: 'taiwan_safe_day_time_log'
};

// 📌 每個頻道獨立的訊息 storage key (防止跨頻道訊息互串 BUG)
function getChannelMsgKey(cipherCode) {
  const safe = (cipherCode || 'CH-01').trim().replace(/[^a-zA-Z0-9\-_]/g, '_').substring(0, 40);
  return `taiwan_safe_chat_messages__${safe}`;
}

// 暗碼保存與讀取
export function getStoredCipherCode() {
  return localStorage.getItem(KEYS.CIPHER_CODE) || '';
}

export function setStoredCipherCode(code) {
  localStorage.setItem(KEYS.CIPHER_CODE, code);
}

// 聊天訊息儲存 (頻道隔離版本)
export function getStoredMessages(cipherCode) {
  try {
    const key = getChannelMsgKey(cipherCode);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : getInitialMessages();
  } catch (e) {
    return getInitialMessages();
  }
}

export function saveMessage(msgObj, cipherCode) {
  const key = getChannelMsgKey(cipherCode);
  const list = getStoredMessages(cipherCode);
  // 防重複儲存：同一 id 只存一次
  if (list.some(m => m.id === msgObj.id)) return list;
  list.push(msgObj);
  localStorage.setItem(key, JSON.stringify(list));
  return list;
}

function getInitialMessages() {
  return [
    {
      id: 'msg-1',
      sender: '指揮組 / 系統廣播',
      text: '歡迎使用台灣急難通 (Taiwan SOS)。請親友對齊『暗碼』後進行安全加密對話與災害圈共享。',
      isEncrypted: false,
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];
}

// 危險地區旗標點位
export function getStoredDangerFlags() {
  try {
    const raw = localStorage.getItem(KEYS.DANGER_FLAGS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveDangerFlag(flagEncryptedObj) {
  const flags = getStoredDangerFlags();
  flags.push(flagEncryptedObj);
  localStorage.setItem(KEYS.DANGER_FLAGS, JSON.stringify(flags));
  return flags;
}

// 自訂彩色災害範圍圈儲存 (Encrypted Hazard Zones)
export function getStoredCustomHazardZones() {
  try {
    const raw = localStorage.getItem(KEYS.HAZARD_ZONES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomHazardZone(encryptedZoneObj) {
  const zones = getStoredCustomHazardZones();
  zones.push(encryptedZoneObj);
  localStorage.setItem(KEYS.HAZARD_ZONES, JSON.stringify(zones));
  return zones;
}

// 每日地圖情報紀錄 (Date-indexed logs)
export function getDailyIntel(dateStr) {
  try {
    const raw = localStorage.getItem(KEYS.DAILY_INTEL);
    const data = raw ? JSON.parse(raw) : {};
    return data[dateStr] || '';
  } catch (e) {
    return '';
  }
}

export function saveDailyIntel(dateStr, content) {
  try {
    const raw = localStorage.getItem(KEYS.DAILY_INTEL);
    const data = raw ? JSON.parse(raw) : {};
    data[dateStr] = content;
    localStorage.setItem(KEYS.DAILY_INTEL, JSON.stringify(data));
  } catch (e) {
    console.error('Save daily intel failed', e);
  }
}

// 📌 彈幕廣播與對話即時動態時間軸 log (day_time_log)
export function getStoredDayTimeLog() {
  try {
    const raw = localStorage.getItem(KEYS.DAY_TIME_LOG);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function appendDayTimeLog(entry) {
  try {
    const logs = getStoredDayTimeLog();
    // 防止同一 id 重複追加
    if (logs.some(l => l.id === entry.id)) return logs;
    logs.push(entry);
    // 保留最近 200 筆 log，防止 localStorage 爆容
    const trimmed = logs.slice(-200);
    localStorage.setItem(KEYS.DAY_TIME_LOG, JSON.stringify(trimmed));
    return trimmed;
  } catch (e) {
    return [];
  }
}

/**
 * 🔄 完全清空本地暫存、快取與舊資料 (避免舊資料干擾)
 */
export async function clearAllCacheAndStorage() {
  try {
    localStorage.clear();
    sessionStorage.clear();

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }

    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (let reg of regs) {
        await reg.unregister();
      }
    }
  } catch (e) {
    console.error('Clear cache failed:', e);
  }
}
