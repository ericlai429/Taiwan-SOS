import React, { useState } from 'react';
import { Volume2, VolumeX, ShieldAlert, X, Radio } from 'lucide-react';

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
      // 警報高低音頻滑音變換 (Sweep 400Hz - 800Hz)
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
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-cyan-500 rounded-3xl p-5 max-w-md w-full text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-senior-lg">
            <Radio className="w-8 h-8 text-cyan-400" />
            <span>防空警報音效與聽力辨識導引</span>
          </div>
          <button
            onClick={() => {
              if (audioCtx) audioCtx.close();
              setIsPlaying(false);
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-2">
            <h4 className="text-senior-base font-extrabold text-amber-300">
              📢 國防防空警報信號規則：
            </h4>
            <ul className="text-senior-sm text-slate-200 space-y-1.5 list-disc pl-5">
              <li><strong>緊急警報：</strong>【一長音、兩短音】重複三次。長音 15 秒、短音各 5 秒。</li>
              <li><strong>解除警報：</strong>【一長音 90 秒】平直持續長音。</li>
            </ul>
          </div>

          <button
            onClick={toggleSirenSound}
            className={`w-full py-4 rounded-2xl font-black text-senior-lg shadow-xl border-2 flex items-center justify-center gap-2 transition-all ${
              isPlaying
                ? 'bg-rose-600 border-white text-white animate-pulse'
                : 'bg-cyan-600 hover:bg-cyan-500 border-cyan-300 text-slate-950'
            }`}
          >
            {isPlaying ? (
              <>
                <VolumeX className="w-7 h-7" />
                <span>停止防空警報模擬音</span>
              </>
            ) : (
              <>
                <Volume2 className="w-7 h-7" />
                <span>播放防空警報聽力試聽 (模擬)</span>
              </>
            )}
          </button>

          <p className="text-senior-sm text-slate-400 text-center">
            💡 試聽音效可用於協助長輩平時熟悉警報聲音，於真正警報響起時第一時間避難。
          </p>
        </div>
      </div>
    </div>
  );
}
