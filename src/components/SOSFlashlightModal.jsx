import React, { useState, useEffect } from 'react';
import { Zap, Sun, AlertTriangle, X, Volume2 } from 'lucide-react';

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
    <div
      className={`fixed inset-0 z-[3000] flex flex-col justify-between p-6 transition-colors duration-100 ${
        mode === 'torch'
          ? 'bg-white text-slate-950'
          : isFlashing
          ? 'bg-rose-600 text-white'
          : 'bg-black text-white'
      }`}
    >
      {/* 頂部關閉 */}
      <div className="flex items-center justify-between">
        <span className="text-senior-lg font-black tracking-wide">
          {mode === 'torch' ? '🔦 停電求救白光手電筒' : '🚨 SOS 爆閃求救燈號'}
        </span>
        <button
          onClick={onClose}
          className={`p-3 rounded-2xl font-black ${
            mode === 'torch' ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-white'
          }`}
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      {/* 中央說明指示 */}
      <div className="text-center my-auto space-y-4">
        <Sun className={`w-24 h-24 mx-auto animate-pulse ${mode === 'torch' ? 'text-amber-500' : 'text-rose-500'}`} />
        <h3 className="text-senior-2xl font-black">
          {mode === 'torch' ? '已將螢幕提升至極致白光' : 'SOS 國際爆閃頻率運作中'}
        </h3>
        <p className="text-senior-lg font-bold max-w-sm mx-auto">
          {mode === 'torch'
            ? '請將手機螢幕朝向走道或受困方向照明。'
            : '以「三短三長三短」頻率閃爍，供搜救人員標定救援位置。'}
        </p>
      </div>

      {/* 底部模式切換 */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto w-full">
        <button
          onClick={() => setMode('torch')}
          className={`py-4 rounded-2xl font-black text-senior-lg shadow-lg border-2 ${
            mode === 'torch' ? 'bg-slate-950 text-white border-slate-700' : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          🔦 常亮手電筒
        </button>
        <button
          onClick={() => setMode('sos')}
          className={`py-4 rounded-2xl font-black text-senior-lg shadow-lg border-2 ${
            mode === 'sos' ? 'bg-rose-700 text-white border-white' : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          🚨 SOS 爆閃求救
        </button>
      </div>
    </div>
  );
}
