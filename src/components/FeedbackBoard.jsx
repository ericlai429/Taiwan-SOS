import React, { useState, useEffect, useRef } from 'react';
import { MessageSquarePlus, Bug, MonitorSmartphone, Lightbulb, Gauge, Send, Trash2, Copy, ExternalLink, CheckCircle, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { sanitizeHTML } from '../utils/security';

const FEEDBACK_STORAGE_KEY = 'taiwan_sos_feedback_entries';
const RATE_LIMIT_KEY = 'taiwan_sos_feedback_rate';
const GITHUB_ISSUES_URL = 'https://github.com/ericlai429/Taiwan-SOS/issues/new';
const GITHUB_PR_LOG_URL = 'https://github.com/ericlai429/Taiwan-SOS/blob/main/pr_log.md';

// ========== 防護常數 ==========
const MAX_CHAR = 500;          // 每則上限 500 字
const MAX_DAILY = 3;           // 每日上限 3 篇
const COOLDOWN_SEC = 30;       // 兩次提交間隔至少 30 秒 (防 DOS 連送)
const MAX_STORED = 50;         // localStorage 最多保留 50 筆 (防爆容量)

// 回饋類型定義
const FEEDBACK_TYPES = [
  { id: 'bug', label: '🐛 BUG 回報', desc: '程式報錯、白畫面、功能壞掉', color: 'border-rose-500 bg-rose-950 text-rose-300' },
  { id: 'ui', label: '📸 畫面異常', desc: '排版跑掉、文字遮擋、圖示消失', color: 'border-amber-500 bg-amber-950 text-amber-300' },
  { id: 'feature', label: '💡 功能建議', desc: '希望新增的功能或改善方向', color: 'border-cyan-500 bg-cyan-950 text-cyan-300' },
  { id: 'perf', label: '⚡ 效能問題', desc: '卡頓、延遲、載入太慢', color: 'border-purple-500 bg-purple-950 text-purple-300' },
];

// ========== 工具函式 ==========

function getDeviceInfo() {
  const ua = navigator.userAgent;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  let os = '未知';
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser = '未知';
  if (/CriOS/.test(ua)) browser = 'Chrome (iOS)';
  else if (/FxiOS/.test(ua)) browser = 'Firefox (iOS)';
  else if (/EdgiOS|Edg/.test(ua)) browser = 'Edge';
  else if (/Chrome/.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Firefox/.test(ua)) browser = 'Firefox';

  const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  return {
    os, browser,
    screen: `${w}×${h} @${dpr}x`,
    isPWA,
    summary: `${os} / ${browser} / ${w}×${h} @${dpr}x${isPWA ? ' (PWA)' : ''}`
  };
}

function loadFeedback() {
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFeedback(entries) {
  try {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_STORED)));
  } catch {}
}

// 📌 防 DOS：取得今日 key (YYYY-MM-DD) 用於每日計數
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 📌 取得今日已提交次數與上次提交時間戳
function getRateInfo() {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { day: getTodayKey(), count: 0, lastTs: 0 };
    const parsed = JSON.parse(raw);
    // 如果是昨天的紀錄，自動重置
    if (parsed.day !== getTodayKey()) return { day: getTodayKey(), count: 0, lastTs: 0 };
    return parsed;
  } catch { return { day: getTodayKey(), count: 0, lastTs: 0 }; }
}

function saveRateInfo(info) {
  try { localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(info)); } catch {}
}

// ========== 元件 ==========

export default function FeedbackBoard() {
  const [entries, setEntries] = useState(loadFeedback);
  const [feedbackType, setFeedbackType] = useState('bug');
  const [description, setDescription] = useState('');
  const [screenshotDesc, setScreenshotDesc] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const textRef = useRef(null);
  const cooldownTimer = useRef(null);

  const deviceInfo = getDeviceInfo();
  const rateInfo = getRateInfo();
  const dailyRemaining = Math.max(0, MAX_DAILY - rateInfo.count);

  useEffect(() => { saveFeedback(entries); }, [entries]);

  // 📌 冷卻計時器 (防 DOS 連送)
  useEffect(() => {
    const now = Date.now();
    const info = getRateInfo();
    const elapsed = Math.floor((now - info.lastTs) / 1000);
    if (elapsed < COOLDOWN_SEC) {
      setCooldownLeft(COOLDOWN_SEC - elapsed);
    }
  }, []);

  useEffect(() => {
    if (cooldownLeft > 0) {
      cooldownTimer.current = setTimeout(() => setCooldownLeft(prev => prev - 1), 1000);
      return () => clearTimeout(cooldownTimer.current);
    }
  }, [cooldownLeft]);

  // 📌 提交回饋 (含多層防護)
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 防護 1：文字清理 (XSS)
    const cleanDesc = sanitizeHTML(description.trim());
    const cleanScreenshot = sanitizeHTML(screenshotDesc.trim());

    // 防護 2：空白檢查
    if (!cleanDesc) {
      setErrorMsg('⚠️ 請填寫問題描述！');
      return;
    }

    // 防護 3：字數上限 500 字
    if (cleanDesc.length > MAX_CHAR) {
      setErrorMsg(`⚠️ 問題描述超過 ${MAX_CHAR} 字上限！目前 ${cleanDesc.length} 字，請精簡描述。`);
      return;
    }
    if (cleanScreenshot.length > MAX_CHAR) {
      setErrorMsg(`⚠️ 截圖說明超過 ${MAX_CHAR} 字上限！`);
      return;
    }

    // 防護 4：每日 3 篇限制
    const info = getRateInfo();
    if (info.count >= MAX_DAILY) {
      setErrorMsg(`⛔ 今日回饋已達上限 (${MAX_DAILY} 篇/天)，請明日再提交。感謝您的熱心回饋！`);
      return;
    }

    // 防護 5：冷卻期 (兩次提交間隔 30 秒)
    const now = Date.now();
    const elapsed = Math.floor((now - info.lastTs) / 1000);
    if (elapsed < COOLDOWN_SEC) {
      const wait = COOLDOWN_SEC - elapsed;
      setCooldownLeft(wait);
      setErrorMsg(`⏳ 提交太頻繁！請等待 ${wait} 秒後再提交 (防止濫用)。`);
      return;
    }

    // 通過所有防護，正式儲存
    const timeStr = new Date().toLocaleString('zh-TW', { hour12: false });
    const typeObj = FEEDBACK_TYPES.find(t => t.id === feedbackType) || FEEDBACK_TYPES[0];

    const newEntry = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: feedbackType,
      typeLabel: typeObj.label,
      description: cleanDesc,
      screenshotDesc: cleanScreenshot,
      device: deviceInfo.summary,
      timestamp: timeStr,
      createdAt: Date.now()
    };

    setEntries(prev => [newEntry, ...prev]);
    setDescription('');
    setScreenshotDesc('');
    setSubmitted(true);
    setCooldownLeft(COOLDOWN_SEC);
    setTimeout(() => setSubmitted(false), 3000);

    // 更新速率紀錄
    saveRateInfo({ day: getTodayKey(), count: info.count + 1, lastTs: now });
  };

  // 產生 pr_log Markdown
  const generateMarkdown = (entry) => {
    return [
      `### ${entry.typeLabel}`,
      `- 🕐 **時間**：${entry.timestamp}`,
      `- 📱 **裝置**：${entry.device}`,
      `- 📝 **描述**：${entry.description}`,
      entry.screenshotDesc ? `- 📸 **截圖說明**：${entry.screenshotDesc}` : '',
      '---'
    ].filter(Boolean).join('\n');
  };

  const copyEntry = (entry) => {
    navigator.clipboard.writeText(generateMarkdown(entry)).then(() => {
      setCopied(entry.id);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const exportAllMarkdown = () => {
    if (entries.length === 0) { alert('目前沒有回饋紀錄可匯出。'); return; }
    const full = '# 📋 台灣急難通 - 使用者意見回饋匯出\n\n' + entries.map(generateMarkdown).join('\n');
    navigator.clipboard.writeText(full).then(() => {
      setCopied('all');
      setTimeout(() => setCopied(''), 3000);
    });
  };

  const openGitHubIssue = () => {
    const typeObj = FEEDBACK_TYPES.find(t => t.id === feedbackType) || FEEDBACK_TYPES[0];
    const body = encodeURIComponent(
      `## ${typeObj.label}\n\n**裝置資訊**：${deviceInfo.summary}\n\n**問題描述**：\n${description || '（請填寫）'}\n\n` +
      (screenshotDesc ? `**截圖說明**：${screenshotDesc}\n\n` : '') +
      `---\n_此回報由台灣急難通 App 意見板產生_`
    );
    const title = encodeURIComponent(`[${typeObj.label}] ${description.substring(0, 50) || '回饋'}`);
    window.open(`${GITHUB_ISSUES_URL}?title=${title}&body=${body}`, '_blank');
  };

  const deleteEntry = (id) => { setEntries(prev => prev.filter(e => e.id !== id)); };

  const charCount = description.length;
  const isOverLimit = charCount > MAX_CHAR;
  const isSubmitDisabled = cooldownLeft > 0 || dailyRemaining <= 0;

  return (
    <div className="max-w-2xl mx-auto p-3.5 pb-28 space-y-3">

      {/* 說明卡 */}
      <div className="bg-gradient-to-br from-indigo-950/90 to-slate-900/90 border-2 border-indigo-500 rounded-2xl p-4 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-[16px]">
          <MessageSquarePlus className="w-6 h-6 text-indigo-400" />
          <span>意見板 — 幫助我們改善程式</span>
        </div>
        <p className="text-[13px] text-slate-300 leading-relaxed">
          🙏 如果您在使用過程中遇到 <strong className="text-rose-300">BUG</strong>、
          <strong className="text-amber-300">畫面異常</strong>、
          <strong className="text-purple-300">效能卡頓</strong>，或有
          <strong className="text-cyan-300">功能建議</strong>，請在此填寫。
          您的回饋將幫助我們持續改善台灣急難通！
        </p>

        {/* 防護規則說明 */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-700 p-2.5 space-y-1">
          <div className="flex items-center gap-1 text-[12px] font-bold text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>防護規則</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <div className="bg-slate-900 rounded-lg border border-slate-800 px-2 py-1.5 text-center">
              <div className="text-amber-300 font-extrabold text-[14px]">{MAX_DAILY}</div>
              <div className="text-slate-400">篇/天</div>
            </div>
            <div className="bg-slate-900 rounded-lg border border-slate-800 px-2 py-1.5 text-center">
              <div className="text-cyan-300 font-extrabold text-[14px]">{MAX_CHAR}</div>
              <div className="text-slate-400">字/篇</div>
            </div>
            <div className="bg-slate-900 rounded-lg border border-slate-800 px-2 py-1.5 text-center">
              <div className="text-purple-300 font-extrabold text-[14px]">{COOLDOWN_SEC}s</div>
              <div className="text-slate-400">冷卻</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 px-0.5">
            今日剩餘：<strong className={dailyRemaining > 0 ? 'text-emerald-400' : 'text-rose-400'}>{dailyRemaining} 篇</strong>
            {' '} | 裝置：<span className="text-cyan-400 font-mono">{deviceInfo.summary}</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-snug">
          📄 回饋將記錄至 GitHub <a href={GITHUB_PR_LOG_URL} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">pr_log.md</a>，也可直接開 GitHub Issue 回報。
        </p>
      </div>

      {/* 回饋表單 */}
      <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-700 rounded-2xl p-3.5 shadow-lg space-y-3">
        <div className="text-[14px] font-bold text-white flex items-center gap-1.5">
          <Bug className="w-4 h-4 text-rose-400" />
          <span>提交新回饋</span>
        </div>

        {/* 回饋類型 */}
        <div className="grid grid-cols-2 gap-1.5">
          {FEEDBACK_TYPES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFeedbackType(t.id)}
              className={`p-2 rounded-xl border-2 text-left transition-all active:scale-95 ${
                feedbackType === t.id
                  ? `${t.color} font-extrabold shadow-lg`
                  : 'border-slate-700 bg-slate-800/80 text-slate-400 hover:border-slate-500'
              }`}
            >
              <div className="text-[12px] font-bold">{t.label}</div>
              <div className="text-[10px] opacity-70 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>

        {/* 問題描述 + 字數計算 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[12px] font-bold text-slate-400">
              📝 問題描述 <span className="text-rose-400">*</span>
            </label>
            <span className={`text-[11px] font-mono font-bold ${isOverLimit ? 'text-rose-400' : charCount > MAX_CHAR * 0.8 ? 'text-amber-400' : 'text-slate-500'}`}>
              {charCount} / {MAX_CHAR}
            </span>
          </div>
          <textarea
            ref={textRef}
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_CHAR + 50))}
            placeholder="請描述您遇到的問題，越詳細越好（上限 500 字）。例如：切換到暗碼群組後畫面空白..."
            rows={4}
            maxLength={MAX_CHAR + 50}
            className={`w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-[14px] text-white placeholder-slate-600 focus:outline-none resize-none leading-relaxed ${
              isOverLimit ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-indigo-500'
            }`}
          />
          {isOverLimit && (
            <p className="text-[11px] text-rose-400 font-bold mt-0.5">⚠️ 超過 {MAX_CHAR} 字上限，請精簡描述！</p>
          )}
        </div>

        {/* 截圖說明 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[12px] font-bold text-slate-400">
              📸 有問題的畫面描述 <span className="text-slate-600">(選填)</span>
            </label>
            <span className="text-[11px] font-mono text-slate-500">{screenshotDesc.length} / {MAX_CHAR}</span>
          </div>
          <input
            type="text"
            value={screenshotDesc}
            onChange={(e) => setScreenshotDesc(e.target.value.slice(0, MAX_CHAR))}
            placeholder="例如：標頭被動態島擋住、按鈕跑出螢幕外..."
            maxLength={MAX_CHAR}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-[13px] text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* 錯誤/警告訊息 */}
        {errorMsg && (
          <div className="bg-rose-950 border border-rose-500 rounded-xl p-2.5 text-rose-300 text-[12px] font-bold flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 操作按鈕列 */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={isSubmitDisabled || isOverLimit}
            className={`flex-1 min-w-[120px] font-bold py-2.5 px-4 rounded-xl text-[14px] shadow-lg flex items-center justify-center gap-1.5 border transition-all ${
              isSubmitDisabled || isOverLimit
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 active:scale-95'
            }`}
          >
            <Send className="w-4 h-4" />
            {cooldownLeft > 0
              ? `冷卻中 ${cooldownLeft}s`
              : dailyRemaining <= 0
              ? '今日已達上限'
              : '提交回饋'}
          </button>

          <button
            type="button"
            onClick={openGitHubIssue}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-3 rounded-xl text-[12px] shadow active:scale-95 flex items-center gap-1.5 border border-slate-600 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>開 GitHub Issue</span>
          </button>
        </div>

        {/* 成功提示 */}
        {submitted && (
          <div className="bg-emerald-950 border border-emerald-500 rounded-xl p-2.5 text-emerald-300 text-[13px] font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>✅ 感謝您的回饋！已儲存至本機紀錄 (今日剩餘 {Math.max(0, dailyRemaining - 1)} 篇)。</span>
          </div>
        )}
      </form>

      {/* 歷史回饋紀錄 */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-2xl shadow-md overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] font-bold text-slate-300 hover:bg-slate-800/80 transition-all"
        >
          <span className="flex items-center gap-1.5">
            📋 歷史回饋紀錄
            <span className="text-[11px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-700 font-mono">
              {entries.length} 筆
            </span>
          </span>
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHistory && (
          <div className="border-t border-slate-800 p-3 space-y-2">
            {entries.length > 0 && (
              <div className="flex gap-2 pb-1">
                <button
                  onClick={exportAllMarkdown}
                  className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-600 text-indigo-300 font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1 active:scale-95"
                >
                  <Copy className="w-3 h-3" />
                  {copied === 'all' ? '✅ 已複製全部！' : '匯出全部 Markdown'}
                </button>
                <a
                  href={GITHUB_PR_LOG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-400 font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  查看 pr_log.md
                </a>
              </div>
            )}

            {entries.length === 0 ? (
              <div className="text-center text-slate-500 text-[13px] py-8">
                <MessageSquarePlus className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <div>尚無回饋紀錄。</div>
                <div className="text-[11px] mt-1">提交您的第一筆回饋，幫助我們改進！</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {entries.map(entry => {
                  const typeObj = FEEDBACK_TYPES.find(t => t.id === entry.type) || FEEDBACK_TYPES[0];
                  return (
                    <div key={entry.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${typeObj.color}`}>
                          {entry.typeLabel}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{entry.timestamp}</span>
                      </div>
                      <div className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                        {entry.description}
                      </div>
                      {entry.screenshotDesc && (
                        <div className="text-[11px] text-amber-400 bg-amber-950/50 px-2 py-1 rounded-lg border border-amber-800">
                          📸 {entry.screenshotDesc}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500">📱 {entry.device}</div>
                      <div className="flex gap-1.5 pt-0.5">
                        <button onClick={() => copyEntry(entry)} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                          <Copy className="w-3 h-3" />
                          {copied === entry.id ? '✅ 已複製' : '複製 Markdown'}
                        </button>
                        <button onClick={() => deleteEntry(entry.id)} className="text-[10px] text-rose-500 hover:text-rose-400 flex items-center gap-0.5">
                          <Trash2 className="w-3 h-3" />
                          刪除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
