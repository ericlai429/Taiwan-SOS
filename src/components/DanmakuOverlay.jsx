import React from 'react';

export default function DanmakuOverlay({ danmakuList }) {
  if (!danmakuList || danmakuList.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[1000] overflow-hidden">
      {danmakuList.map((item) => (
        <div
          key={item.id}
          className="absolute whitespace-nowrap font-bold text-[10px] sm:text-xs text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-slate-900/85 px-2 py-0.5 rounded-lg border border-amber-500/50 shadow-md animate-danmaku-fly"
          style={{
            top: `${item.topPercent}%`,
            animationDuration: `${item.speedSeconds || 12}s`,
            animationTimingFunction: 'linear'
          }}
        >
          <span className="text-cyan-400 mr-1 font-mono text-[9px]">[{item.sender || '全台廣播'}]</span>
          {item.text}
        </div>
      ))}
    </div>
  );
}
