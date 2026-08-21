import React, { useState, useEffect } from 'react';
import { Zap, Sun, AlertTriangle, X } from 'lucide-react';

export default function SOSFlashlightModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('torch'); // 'torch', 'sos'
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    let intervalId;
    if (mode === 'sos' && isOpen) {
      intervalId = setInterval(() => {
        setIsFlashing(prev => !prev);
      }, 300);
    } else {
      setIsFlashing(false);
    }
    return () => clearInterval(intervalId);
  }, [mode, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      {/* 縮小 50% 的精簡白光與 SOS 爆閃 Modal 視窗 */}
      <div
        className={`max-w-sm w-full rounded-2xl p-4 shadow-2xl border-2 transition-colors duration-100 relative ${
          mode === 'torch'
            ? 'bg-slate-900 border-amber-500 text-white'
            : isFlashing
            ? 'bg-rose-600 border-rose-400 text-white'
            : 'bg-black border-slate-700 text-white'
        }`}
      >
        {/* 頂部標頭與關閉 */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
          <div className="flex items-center gap-1.5 font-extrabold text-xs sm:text-sm">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{mode === 'torch' ? '🔦 停電求救白光手電筒' : '🚨 SOS 爆閃求救燈號'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 中央說明指示 (縮小 50%) */}
        <div className="text-center my-4 space-y-2">
          <Sun className={`w-12 h-12 mx-auto animate-pulse ${mode === 'torch' ? 'text-amber-400' : 'text-rose-400'}`} />
          <h4 className="text-sm font-bold">
            {mode === 'torch' ? '螢幕提升至極致白光' : 'SOS 國際爆閃頻率運作中'}
          </h4>
          <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-xs mx-auto">
            {mode === 'torch'
              ? '請將手機螢幕朝向走道或受困方向照明。'
              : '以「三短三長三短」頻率閃爍供搜救人員標定。'}
          </p>
        </div>

        {/* 底部模式切換 (縮小 50%) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => setMode('torch')}
            className={`py-2 rounded-xl font-bold text-xs shadow border transition-all active:scale-95 ${
              mode === 'torch' ? 'bg-amber-500 text-slate-950 border-amber-300' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            🔦 常亮手電筒
          </button>
          <button
            onClick={() => setMode('sos')}
            className={`py-2 rounded-xl font-bold text-xs shadow border transition-all active:scale-95 ${
              mode === 'sos' ? 'bg-rose-600 text-white border-white' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            🚨 SOS 爆閃求救
          </button>
        </div>
      </div>
    </div>
  );
}
