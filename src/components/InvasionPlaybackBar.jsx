import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, ShieldAlert, FastForward } from 'lucide-react';
import invasionHistoryData from '../data/invasion_history.json';

export default function InvasionPlaybackBar({ currentStepIndex, setCurrentStepIndex }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const totalSteps = invasionHistoryData.length;
  const currentSnapshot = invasionHistoryData[currentStepIndex] || invasionHistoryData[0];

  // 自動播放計時器 (每 1.5 秒向前推進一個 30 分鐘時間點)
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSteps, setCurrentStepIndex]);

  const togglePlay = () => {
    if (currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-slate-900/95 border-2 border-purple-600/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md space-y-2 text-white">
      {/* 頂部標頭與時間點 */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-purple-950 border border-purple-500 rounded-xl">
            <Clock className="w-5 h-5 text-purple-400" />
          </span>
          <div>
            <div className="text-xs text-purple-300 font-bold">敵佔領與快艇推進 30 分鐘演變回放</div>
            <h4 className="text-senior-base font-black text-amber-300">{currentSnapshot.timeLabel}</h4>
          </div>
        </div>

        {/* 播放/暫停按鈕 */}
        <button
          onClick={togglePlay}
          className={`px-3 py-1.5 rounded-xl font-black text-senior-sm flex items-center gap-1.5 shadow-lg active:scale-95 transition-all border ${
            isPlaying
              ? 'bg-rose-600 border-white text-white animate-pulse'
              : 'bg-purple-600 hover:bg-purple-500 border-purple-300 text-white'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              <span>⏸ 暫停回放</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>▶ 播放動態演變</span>
            </>
          )}
        </button>
      </div>

      {/* 30 分鐘時間軸拖拉 Slider Bar */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={totalSteps - 1}
          value={currentStepIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentStepIndex(Number(e.target.value));
          }}
          className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />

        {/* 時間軸刻度標記 */}
        <div className="flex justify-between text-[11px] text-slate-400 font-mono px-1">
          {invasionHistoryData.map((step, idx) => (
            <span
              key={step.timeKey}
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex(idx);
              }}
              className={`cursor-pointer hover:text-white transition-all ${
                idx === currentStepIndex ? 'text-amber-300 font-bold underline scale-110' : ''
              }`}
            >
              {step.timeKey}
            </span>
          ))}
        </div>
      </div>

      {/* 情況動態描述條 */}
      <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-xl text-xs sm:text-senior-sm text-slate-200">
        💡 <strong>敵情動態：</strong>{currentSnapshot.description}
      </div>
    </div>
  );
}
