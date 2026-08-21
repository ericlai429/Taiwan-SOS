import React, { useState, useEffect } from 'react';
import { Send, Clock, Radio } from 'lucide-react';

export default function DanmakuInputBar({ onSendDanmaku }) {
  const [text, setText] = useState('');
  const [cooldownSec, setCooldownSec] = useState(0);

  // 30 秒冷卻倒數計時器
  useEffect(() => {
    let timer;
    if (cooldownSec > 0) {
      timer = setInterval(() => {
        setCooldownSec(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSec]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (cooldownSec > 0) return;

    onSendDanmaku(text.trim());
    setText('');
    setCooldownSec(30); // 啟動 30 秒冷卻
  };

  return (
    <form
      onSubmit={handleSend}
      className="w-full bg-slate-900/95 border-2 border-cyan-500/80 rounded-2xl p-2 shadow-2xl backdrop-blur-md flex items-center gap-2 text-white"
    >
      <div className="p-2 bg-cyan-950 border border-cyan-600 rounded-xl text-cyan-400 shrink-0 flex items-center justify-center">
        <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
      </div>

      {/* 大尺寸、寬敞輸入框 */}
      <input
        type="text"
        value={text}
        maxLength={40}
        onChange={(e) => setText(e.target.value)}
        placeholder={cooldownSec > 0 ? `請等待倒數冷卻 (${cooldownSec}s)...` : "廣播發話 (如：台北車站備有水源)..."}
        disabled={cooldownSec > 0}
        className="flex-1 bg-slate-950 text-white placeholder-slate-400 text-senior-base font-bold px-3.5 py-2.5 h-11 rounded-xl border-2 border-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 disabled:opacity-50 transition-all min-w-0"
      />

      {/* 大尺寸點擊按鈕 */}
      <button
        type="submit"
        disabled={!text.trim() || cooldownSec > 0}
        className={`h-11 px-3.5 rounded-xl font-black text-senior-base flex items-center gap-1.5 shadow-lg border transition-all shrink-0 active:scale-95 ${
          cooldownSec > 0
            ? 'bg-slate-800 border-slate-700 text-amber-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-cyan-300 text-white'
        }`}
      >
        {cooldownSec > 0 ? (
          <>
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="font-mono">{cooldownSec}s</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>發射</span>
          </>
        )}
      </button>
    </form>
  );
}
