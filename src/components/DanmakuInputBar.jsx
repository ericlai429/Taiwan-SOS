import React, { useState, useEffect } from 'react';
import { Send, Clock, Radio, MessageSquarePlus } from 'lucide-react';

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
      className="bg-slate-900/95 border-2 border-cyan-500/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-2 text-white"
    >
      <div className="flex items-center gap-1 pl-2 text-cyan-400 font-bold text-xs shrink-0">
        <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="hidden sm:inline">即時彈幕廣播：</span>
      </div>

      <input
        type="text"
        value={text}
        maxLength={40}
        onChange={(e) => setText(e.target.value)}
        placeholder={cooldownSec > 0 ? `請等待倒數冷卻 (${cooldownSec}s)...` : "輸入緊急廣播 (如：台北車站備有水源)..."}
        disabled={cooldownSec > 0}
        className="flex-1 bg-slate-950/80 text-white placeholder-slate-400 text-xs sm:text-senior-sm px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={!text.trim() || cooldownSec > 0}
        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-lg border transition-all shrink-0 ${
          cooldownSec > 0
            ? 'bg-slate-800 border-slate-700 text-amber-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-cyan-300 text-white active:scale-95'
        }`}
      >
        {cooldownSec > 0 ? (
          <>
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>⏱️ {cooldownSec}s 倒數</span>
          </>
        ) : (
          <>
            <Send className="w-3.5 h-3.5" />
            <span>📢 發射彈幕</span>
          </>
        )}
      </button>
    </form>
  );
}
