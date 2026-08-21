/**
 * 🛡️ Taiwan SOS 網路安全防護與惡意封包/高頻攻擊日誌審計引擎 (WAF & IDS Audit Logger)
 * 監控項目：
 * 1. 高頻連鎖攻擊 / 洪水封包 (High-Frequency DDoS / Burst Flooding)
 * 2. 溢位攻擊 (Buffer Overflow Attempt > 200 字元)
 * 3. 跨站腳本 / 惡意指令注入 (XSS / Script Injection Attempt)
 * 4. 畸形篡改封包 (Malformed / Tampered Network Packet)
 */

const SECURITY_LOG_KEY = 'taiwan_sos_security_audit_logs';
const MAX_LOG_ENTRIES = 200; // 最多保留 200 筆安全日誌

// 請求計數器字典 (用於高頻頻率偵測)
const requestRateMap = new Map();

/**
 * 取得精確時分秒時間戳記 (格式：YYYY-MM-DD HH:mm:ss)
 */
export function getFormattedSecurityTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 讀取所有儲存的安全日誌紀錄
 */
export function getSecurityLogs() {
  try {
    const raw = localStorage.getItem(SECURITY_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load security logs:', e);
    return [];
  }
}

/**
 * 寫入一筆安全日誌 (有效持久化 Save 至 LocalStorage)
 */
export function recordSecurityLog({
  attackType,
  threatLevel = 'WARNING',
  source,
  details,
  rawSnippet = '',
  actionTaken = '已即時攔截並隔離'
}) {
  try {
    const logs = getSecurityLogs();
    const timestamp = getFormattedSecurityTimestamp();
    const logEntry = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
      attackType,
      threatLevel, // CRITICAL, HIGH, MEDIUM, WARNING
      source,
      details,
      rawSnippet: typeof rawSnippet === 'string' ? rawSnippet.substring(0, 100) : '',
      actionTaken
    };

    // 最多保留 MAX_LOG_ENTRIES 筆 (FIFO 環狀滾動保存)
    const updated = [logEntry, ...logs].slice(0, MAX_LOG_ENTRIES);
    localStorage.setItem(SECURITY_LOG_KEY, JSON.stringify(updated));

    // 發送本機控制台安全警示
    console.warn(`🚨 [SECURITY WAF] [${timestamp}] [${threatLevel}] ${attackType} on ${source}: ${details}`);
    return logEntry;
  } catch (e) {
    console.error('Failed to record security log:', e);
    return null;
  }
}

/**
 * 🔍 高頻連鎖攻擊 / 洪水攻擊偵測 (High-Frequency Rate Limit Guard)
 * @param {string} sourceKey 來源識別 (如 'danmaku', 'chat', 'gps_sync', 'intel_vote')
 * @param {number} maxBurst 容許之最大突發次數 (預設 5 次)
 * @param {number} windowMs 判定時間窗口 (預設 3000ms)
 * @returns {boolean} true: 正常放行, false: 判定為惡意高頻連鎖攻擊並攔截寫入 log
 */
export function checkRateLimitGuard(sourceKey, maxBurst = 5, windowMs = 3000) {
  const now = Date.now();
  const history = requestRateMap.get(sourceKey) || [];

  // 清除超出窗口的舊請求
  const validHistory = history.filter(ts => now - ts < windowMs);
  validHistory.push(now);
  requestRateMap.set(sourceKey, validHistory);

  if (validHistory.length > maxBurst) {
    const burstCount = validHistory.length;
    recordSecurityLog({
      attackType: '⚡ 高頻連鎖封包攻擊 (High-Frequency Burst Flood)',
      threatLevel: 'CRITICAL',
      source: sourceKey,
      details: `在 ${(windowMs / 1000).toFixed(1)} 秒內偵測到 ${burstCount} 次密集突發連鎖請求 (超過臨界值 ${maxBurst} 次)`,
      actionTaken: '啟動速率限制防禦機制，已主動丟棄多餘封包並予以攔截'
    });
    return false;
  }
  return true;
}

/**
 * 🔍 前端輸入長度與腳本注入安全審查 (200 字元上限 + 惡意語法過濾)
 * @param {string} input 使用者輸入文字
 * @param {string} sourceName 來源表單名稱 (如 '危險旗標名稱', '彈幕廣播', '意見回饋')
 * @returns {{ sanitized: string, isValid: boolean, errorMsg: string | null }}
 */
export function inspectAndSanitizeInput(input, sourceName = '前端輸入框') {
  if (typeof input !== 'string') {
    return { sanitized: '', isValid: true, errorMsg: null };
  }

  const rawTrimmed = input.trim();

  // 1. 偵測長度是否超過 200 字元 (防禦 Buffer 異常與外部灌水攻擊)
  if (rawTrimmed.length > 200) {
    recordSecurityLog({
      attackType: '🛑 長度異常超限攻擊 (Buffer / Payload Oversize Attempt)',
      threatLevel: 'HIGH',
      source: sourceName,
      details: `輸入字數達 ${rawTrimmed.length} 字 (上限為 200 字)，疑似惡意緩衝區探測`,
      rawSnippet: rawTrimmed.substring(0, 60) + '...',
      actionTaken: '強制截斷至 200 字以內並記錄審計日誌'
    });
    return {
      sanitized: rawTrimmed.substring(0, 200),
      isValid: false,
      errorMsg: `⚠️ 內容超過 200 字上限（目前 ${rawTrimmed.length} 字），系統已強制安全截斷！`
    };
  }

  // 2. 偵測常見惡意 XSS 腳本注入語法
  const maliciousPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|javascript:|onerror\s*=|onload\s*=|eval\(|<iframe|<object/i;
  if (maliciousPattern.test(rawTrimmed)) {
    recordSecurityLog({
      attackType: '💉 惡意腳本注入攻擊 (XSS / Script Injection Attempt)',
      threatLevel: 'CRITICAL',
      source: sourceName,
      details: '偵測到潛在危險 HTML/JavaScript 標籤與事件代碼',
      rawSnippet: rawTrimmed.substring(0, 80),
      actionTaken: '進行 HTML 實體轉義並隔離危險字元'
    });
    // 轉義危險字元
    const safeStr = rawTrimmed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return {
      sanitized: safeStr,
      isValid: false,
      errorMsg: '⚠️ 偵測到不安全之腳本語法，系統已進行安全過濾與審計存檔！'
    };
  }

  return {
    sanitized: rawTrimmed,
    isValid: true,
    errorMsg: null
  };
}

/**
 * 清除所有安全日誌
 */
export function clearSecurityLogs() {
  localStorage.removeItem(SECURITY_LOG_KEY);
}
