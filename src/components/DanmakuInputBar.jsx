import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, Radio, GripHorizontal } from 'lucide-react';

export default function DanmakuInputBar({ onSendDanmaku }) {
  const [text, setText] = useState('');
  const [cooldownSec, setCooldownSec] = useState(0);

  // 垂直自由拖動 Y 軸位移狀態 (可上下自由滑動，預設在 0)
  const [offsetY, setOffsetY] = useState(0);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const initialOffsetRef = useRef(0);

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

  // Touch & Mouse 垂直拖曳處理
  const handleDragStart = (clientY) => {
    isDraggingRef.current = true;
    startYRef.current = clientY;
    initialOffsetRef.current = offsetY;
  };

  const handleDragMove = (clientY) => {
    if (!isDraggingRef.current) return;
    const deltaY = clientY - startYRef.current;
    // 限制拖動範圍在向上 -450px 到向下 0px 之間 (絕不覆蓋底部導覽列)
    const newOffset = Math.min(0, Math.max(-450, initialOffsetRef.current + deltaY));
    setOffsetY(newOffset);
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const onMouseMove = (e) => handleDragMove(e.clientY);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e) => {
      if (isDraggingRef.current && e.touches[0]) {
        handleDragMove(e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handleDragEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
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
      style={{ transform: `translateY(${offsetY}px)` }}
      className="w-full transition-transform duration-75 touch-none"
    >
      {/* ═ 上下自由拖動控制抓把手 (Vertical Drag Handle) */}
      <div
        onMouseDown={(e) => handleDragStart(e.clientY)}
        onTouchStart={(e) => e.touches[0] && handleDragStart(e.touches[0].clientY)}
        className="w-full flex items-center justify-center py-1 cursor-grab active:cursor-grabbing bg-slate-900/90 rounded-t-2xl border-t-2 border-x-2 border-cyan-500/80 shadow-md select-none"
        title="按住此處可上下自由拖動發話框"
      >
        <div className="flex items-center gap-1.5 text-cyan-400">
          <GripHorizontal className="w-4 h-4 animate-pulse" />
          <span className="text-[10px] font-black text-cyan-300 tracking-wider">▲ 上下按住拖動 ▲</span>
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="w-full bg-slate-900/95 border-b-2 border-x-2 border-cyan-500/80 rounded-b-2xl p-2 shadow-2xl backdrop-blur-md flex items-center gap-2 text-white"
      >
        <div className="p-2 bg-cyan-950 border border-cyan-600 rounded-xl text-cyan-400 shrink-0 flex items-center justify-center">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
        </div>

        {/* 大尺寸、寬敞輸入框 */}
        <input
          type="text"
          value={text}
          maxLength={40}
          onChange={(e) => setText(e.target.value)}
          placeholder={cooldownSec > 0 ? `請等待倒數冷卻 (${cooldownSec}s)...` : "廣播發話 (如：台北車站備有水源)..."}
          disabled={cooldownSec > 0}
          className="flex-1 bg-slate-950 text-white placeholder-slate-400 text-senior-base font-bold px-3.5 py-2 h-11 rounded-xl border-2 border-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 disabled:opacity-50 transition-all min-w-0"
        />

        {/* 大尺寸發射按鈕 */}
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
    </div>
  );
}
