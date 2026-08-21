import React, { useState, useEffect } from 'react';
import { Play, Pause, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import invasionHistoryData from '../data/invasion_history.json';

export default function InvasionPlaybackBar({ currentStepIndex, setCurrentStepIndex }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const togglePlay = (e) => {
    e.stopPropagation();
    if (currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-slate-900/95 border-2 border-purple-600/80 rounded-2xl shadow-2xl backdrop-blur-md text-white overflow-hidden">
      {/* 精簡頂部橫條 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-2 flex items-center justify-between cursor-pointer active:bg-slate-800"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="p-1 bg-purple-950 border border-purple-500 rounded-lg shrink-0">
            <Clock className="w-4 h-4 text-purple-400" />
          </span>
          <div className="truncate">
            <h4 className="text-xs sm:text-senior-sm font-black text-amber-300 truncate">
              {currentSnapshot.timeLabel}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={togglePlay}
            className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow border transition-all ${
              isPlaying
                ? 'bg-rose-600 border-white text-white animate-pulse'
                : 'bg-purple-600 hover:bg-purple-500 border-purple-300 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>暫停</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>播放</span>
              </>
            )}
          </button>

          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-purple-400" />
          )}
        </div>
      </div>

      {/* 展開時間軸與詳細文字 (非展開狀態時隱藏，大幅省下地圖空間) */}
      {isExpanded && (
        <div className="p-2.5 border-t border-purple-900/60 space-y-2 animate-fadeIn">
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
            <div className="flex justify-between text-[8.5px] sm:text-[10px] text-slate-400 font-mono px-0.5 overflow-hidden">
              {invasionHistoryData.map((step, idx) => (
                <span
                  key={step.timeKey}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying(false);
                    setCurrentStepIndex(idx);
                  }}
                  className={`cursor-pointer hover:text-white transition-all shrink-0 ${
                    idx === currentStepIndex ? 'text-amber-300 font-bold underline scale-105' : ''
                  }`}
                >
                  {step.timeKey}
                </span>
              ))}
            </div>
          </div>

          {/* 情況動態描述條 */}
          <div className="bg-slate-950/90 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 leading-snug">
            💡 <strong>敵情動態：</strong>{currentSnapshot.description}
          </div>
        </div>
      )}
    </div>
  );
}
