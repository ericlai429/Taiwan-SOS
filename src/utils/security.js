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
  if (code.length < 4) return { score: 1, label: '極弱 (易被字典猜解)', color: 'text-rose-400' };
  if (code.length < 8) return { score: 2, label: '中等 (建議 8 位以上英數)', color: 'text-amber-400' };
  return { score: 3, label: '高強度 (加密防護完善)', color: 'text-emerald-400' };
}
