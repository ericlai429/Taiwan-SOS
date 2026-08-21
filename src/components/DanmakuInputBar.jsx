import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, Radio, GripHorizontal } from 'lucide-react';

export default function DanmakuInputBar({ onSendDanmaku }) {
  const [text, setText] = useState('');
  const [cooldownSec, setCooldownSec] = useState(0);

  // 垂直自由拖動直接操作 DOM，避開 React State 重新渲染 (徹底解決地圖範圍圈消失 Bug)
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const currentOffsetRef = useRef(0);

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

  // Touch & Mouse 垂直拖曳處理 (直接更新 DOM style.transform，並呼叫 stopPropagation)
  const handleDragStart = (clientY, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    isDraggingRef.current = true;
    startYRef.current = clientY;
  };

  const handleDragMove = (clientY, e) => {
    if (!isDraggingRef.current) return;
    if (e && e.stopPropagation) e.stopPropagation();

    const deltaY = clientY - startYRef.current;
    // 限制拖動範圍在向上 -450px 到向下 0px 之間 (絕不覆蓋底部導覽列)
    const newOffset = Math.min(0, Math.max(-450, currentOffsetRef.current + deltaY));

    if (containerRef.current) {
      containerRef.current.style.transform = `translateY(${newOffset}px)`;
    }
  };

  const handleDragEnd = (e) => {
    if (isDraggingRef.current) {
      if (e && e.stopPropagation) e.stopPropagation();
      isDraggingRef.current = false;
      // 紀錄最終位移
      if (containerRef.current) {
        const match = containerRef.current.style.transform.match(/translateY\((-?\d+\.?\d*)px\)/);
        if (match && match[1]) {
          currentOffsetRef.current = parseFloat(match[1]);
        }
      }
    }
  };

  useEffect(() => {
    const onMouseMove = (e) => handleDragMove(e.clientY, e);
    const onMouseUp = (e) => handleDragEnd(e);
    const onTouchMove = (e) => {
      if (isDraggingRef.current && e.touches[0]) {
        handleDragMove(e.touches[0].clientY, e);
      }
    };
    const onTouchEnd = (e) => handleDragEnd(e);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (cooldownSec > 0) return;

    onSendDanmaku(text.trim());
    setText('');
    setCooldownSec(30);
  };

  return (
    <div
      ref={containerRef}
      style={{ transform: 'translateY(0px)' }}
      className="w-full touch-none"
    >
      {/* ═ 上下自由拖動控制抓把手 (Vertical Drag Handle) */}
      <div
        onMouseDown={(e) => handleDragStart(e.clientY, e)}
        onTouchStart={(e) => e.touches[0] && handleDragStart(e.touches[0].clientY, e)}
        className="w-full flex items-center justify-center py-1 cursor-grab active:cursor-grabbing bg-slate-900/95 rounded-t-2xl border-t-2 border-x-2 border-cyan-500/80 shadow-md select-none"
        title="按住此處可上下自由拖動發話框"
      >
        <div className="flex items-center gap-1.5 text-cyan-400">
          <GripHorizontal className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] font-black text-cyan-300 tracking-wider">▲ 上下按住拖動 ▲</span>
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="w-full bg-slate-900/95 border-b-2 border-x-2 border-cyan-500/80 rounded-b-2xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1.5 text-white"
      >
        <div className="p-1.5 bg-cyan-950 border border-cyan-600 rounded-lg text-cyan-400 shrink-0 flex items-center justify-center">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        </div>

        {/* 寬敞極致可視面積輸入框 */}
        <input
          type="text"
          value={text}
          maxLength={40}
          onChange={(e) => setText(e.target.value)}
          placeholder={cooldownSec > 0 ? `請等待倒數冷卻 (${cooldownSec}s)...` : "廣播發話 (如：台北車站備有水源)..."}
          disabled={cooldownSec > 0}
          className="flex-1 bg-slate-950 text-white placeholder-slate-400 text-xs font-semibold px-2.5 py-1 h-8 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 disabled:opacity-50 transition-all min-w-0"
        />

        {/* 純紙飛機圖示發射按鈕 (取消文字「發射」，大幅增加輸入框可視面積) */}
        <button
          type="submit"
          disabled={!text.trim() || cooldownSec > 0}
          title="點擊發射廣播"
          className={`w-9 h-8 rounded-lg font-bold text-xs flex items-center justify-center shadow-md border transition-all shrink-0 active:scale-95 ${
            cooldownSec > 0
              ? 'bg-slate-800 border-slate-700 text-amber-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-cyan-300 text-white'
          }`}
        >
          {cooldownSec > 0 ? (
            <span className="font-mono text-[10px] text-amber-400 font-bold">{cooldownSec}s</span>
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </form>
    </div>
  );
}
