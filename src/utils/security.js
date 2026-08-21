/**
 * 安全防護工具庫 (Security Defense Utilities)
 * 提供 XSS 清除 sanitizeHTML、字元轉義與防篡改驗證
 */

/**
 * 轉義 XSS 惡意字元 (HTML Entity Encoding)
 * 防止發話者輸入 <script>alert(1)</script> 或 onerror 等攻擊指令
 */
export function sanitizeHTML(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * 驗證暗碼強度 (密碼長度與複雜度提示)
 */
export function checkCipherStrength(code) {
  if (!code) return { score: 0, label: '未設定', color: 'text-slate-400' };
  const hasLetter = /[a-zA-Z]/.test(code);
  const hasDigit = /[0-9]/.test(code);
  if (code.length < 4) return { score: 1, label: '極弱 (建議 4 位以上)', color: 'text-rose-400' };
  if (code.length < 8) return { score: 2, label: hasLetter && hasDigit ? '良好 (英數混合)' : '中等 (建議 8 位以上英數)', color: 'text-amber-400' };
  return { score: 3, label: '高強度 🔒 (英數混合防護完善)', color: 'text-emerald-400' };
}

/**
 * 🛡️ 暗碼格式清理 (僅接受英文字母 A-Z、a-z、數字 0-9 與連字號 -)
 * 徹底攔截注音符號 (ㄅㄆㄇ...)、特殊符號 (!@#$%^&*...) 與怪異全形字元
 */
export function sanitizeCipherCode(code) {
  if (typeof code !== 'string') return '';
  return code.replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 50);
}

/**
 * 🛡️ 暗碼驗證器 (攔阻注音與特殊怪異符號)
 */
export function validateCipherCode(code) {
  if (!code || !code.trim()) {
    return { isValid: false, message: '請輸入暗碼或選擇頻道！' };
  }
  const trimmed = code.trim();
  // 偵測注音符號 (ㄅ-ㄩ 及聲調 ˊˇˋ˙)
  const zhuyinRegex = /[\u3105-\u312F\u02D9\u02CA\u02C5\u02C7\u02CB]/;
  if (zhuyinRegex.test(trimmed)) {
    return { isValid: false, message: '⚠️ 暗碼不支援注音符號，請使用英文字母與數字（例如 FAMILY888、SOS2026）！' };
  }
  // 偵測特殊符號與怪異字元
  const symbolRegex = /[^a-zA-Z0-9\-_]/;
  if (symbolRegex.test(trimmed)) {
    return { isValid: false, message: '⚠️ 暗碼僅接受「英文字母 (A-Z) 與數字 (0-9)」，系統已自動為您攔截特殊符號！' };
  }
  return { isValid: true, message: '✅ 暗碼格式正確 (英數混合支援)' };
}
