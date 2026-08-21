import React, { useState } from 'react';
import { Volume2, VolumeX, X, Radio } from 'lucide-react';

export default function SirenAudioModal({ isOpen, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCtx, setAudioCtx] = useState(null);

  // 使用 Web Audio API 合成防空警報模擬音效 (一長音兩短音)
  const toggleSirenSound = () => {
    if (isPlaying) {
      if (audioCtx) {
        audioCtx.close();
        setAudioCtx(null);
      }
      setIsPlaying(false);
      return;
    }

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 1.5);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 3.0);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      setAudioCtx(ctx);
      setIsPlaying(true);
    } catch (e) {
      alert('您的瀏覽器不支援音效合成功能');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      {/* 縮小 50% 的精簡防空警報 Modal 視窗 */}
      <div className="bg-slate-900 border-2 border-cyan-500 rounded-2xl p-3.5 max-w-sm w-full text-white shadow-2xl space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <div className="flex items-center gap-1.5 text-cyan-400 font-extrabold text-xs sm:text-sm">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>防空警報音效與聽力辨識</span>
          </div>
          <button
            onClick={() => {
              if (audioCtx) audioCtx.close();
              setIsPlaying(false);
              onClose();
            }}
            className="p-0.5 text-slate-400 hover:text-white rounded-full bg-slate-800 border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 space-y-1">
            <h4 className="text-xs font-bold text-amber-300">
              📢 防空警報信號規則：
            </h4>
            <ul className="text-[11px] text-slate-200 space-y-1 list-disc pl-4 leading-tight">
              <li><strong>緊急警報：</strong>【一長音、兩短音】重複三次。</li>
              <li><strong>解除警報：</strong>【一長音 90 秒】平直持續長音。</li>
            </ul>
          </div>

          <button
            onClick={toggleSirenSound}
            className={`w-full py-2 rounded-xl font-bold text-xs shadow-md border flex items-center justify-center gap-1.5 transition-all ${
              isPlaying
                ? 'bg-rose-600 border-white text-white animate-pulse'
                : 'bg-cyan-600 hover:bg-cyan-500 border-cyan-300 text-slate-950'
            }`}
          >
            {isPlaying ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>停止防空警報模擬音</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>播放防空警報聽力試聽 (模擬)</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-400 text-center leading-tight">
            💡 試聽音效可用於協助長輩平時熟悉警報聲音。
          </p>
        </div>
      </div>
    </div>
  );
}
