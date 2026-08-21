/**
 * LocalStorage / 離線資料持久化管理
 */

const KEYS = {
  CIPHER_CODE: 'taiwan_safe_cipher_code',
  CHAT_MESSAGES: 'taiwan_safe_chat_messages',
  DANGER_FLAGS: 'taiwan_safe_danger_flags',
  HAZARD_ZONES: 'taiwan_safe_hazard_zones',
  DAILY_INTEL: 'taiwan_safe_daily_intel',
  HEARTBEATS: 'taiwan_safe_heartbeats'
};

// 暗碼保存與讀取
export function getStoredCipherCode() {
  return localStorage.getItem(KEYS.CIPHER_CODE) || '';
}

export function setStoredCipherCode(code) {
  localStorage.setItem(KEYS.CIPHER_CODE, code);
}

// 聊天訊息儲存
export function getStoredMessages() {
  try {
    const raw = localStorage.getItem(KEYS.CHAT_MESSAGES);
    return raw ? JSON.parse(raw) : getInitialMessages();
  } catch (e) {
    return getInitialMessages();
  }
}

export function saveMessage(msgObj) {
  const list = getStoredMessages();
  list.push(msgObj);
  localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(list));
  return list;
}

function getInitialMessages() {
  return [
    {
      id: "msg-1",
      sender: "指揮組 / 系統廣播",
      text: "歡迎使用雙北桃園安全避難網。請親友對齊『暗碼』後進行安全加密對話與災害圈共享。",
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
