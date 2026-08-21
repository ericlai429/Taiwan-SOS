import React from 'react';
import { Layers, Droplets, Ban, Flame, ShieldCheck, Skull, AlertOctagon, Waves } from 'lucide-react';

export default function HazardLegendCard({
  showUtility, setShowUtility,
  showBlockade, setShowBlockade,
  showCasualty, setShowCasualty,
  showRadius, setShowRadius,
  showInvasion, setShowInvasion,
  showMissile, setShowMissile,
  showCoastal, setShowCoastal
}) {
  return (
    <div className="bg-slate-900/95 border-2 border-slate-700 rounded-2xl p-2.5 shadow-xl backdrop-blur-md space-y-2 text-senior-sm text-white">
      <div className="flex items-center justify-between border-b border-slate-700 pb-1 font-black text-amber-400 text-senior-base">
        <div className="flex items-center gap-1.5">
          <Layers className="w-5 h-5 text-amber-400" />
          <span>災害與敵情圖例圖層</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {/* 😈 敵佔領區 */}
        <button
          onClick={() => setShowInvasion(!showInvasion)}
          className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all text-xs ${
            showInvasion
              ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-md font-black'
              : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0 animate-ping"></span>
          <Skull className="w-4 h-4 text-purple-400" />
          <span>😈 敵佔領區</span>
        </button>

        {/* 🚨 飛彈熱區 */}
        <button
          onClick={() => setShowMissile(!showMissile)}
          className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all text-xs ${
            showMissile
              ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md'
              : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0"></span>
          <AlertOctagon className="w-4 h-4 text-rose-400" />
          <span>🚨 飛彈熱區</span>
        </button>

        {/* 🌊 沿海預警 */}
        <button
          onClick={() => setShowCoastal(!showCoastal)}
          className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all text-xs ${
            showCoastal
              ? 'bg-orange-950 border-orange-500 text-orange-300 shadow-md'
              : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
          <Waves className="w-4 h-4 text-orange-400" />
          <span>🌊 沿海預警</span>
        </button>

        {/* 💧 停水卡其區 */}
        <button
          onClick={() => setShowUtility(!showUtility)}
          className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all text-xs ${
            showUtility
              ? 'bg-[#3d3722] border-[#c2b280] text-[#e8dfbe]'
              : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-[#c2b280] shrink-0"></span>
          <Droplets className="w-4 h-4 text-[#c2b280]" />
          <span>💧 停水卡其</span>
        </button>

        {/* 🚧 封橋封路 */}
        <button
          onClick={() => setShowBlockade(!showBlockade)}
          className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all text-xs ${
            showBlockade
              ? 'bg-orange-950 border-orange-500 text-orange-300'
              : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
          <Ban className="w-4 h-4 text-orange-400" />
          <span>🚧 封橋封路</span>
        </button>

        {/* 💥 傷亡破壞 */}
        <button
          onClick={() => setShowCasualty(!showCasualty)}
          className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all text-xs ${
            showCasualty
              ? 'bg-rose-950 border-rose-500 text-rose-300'
              : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0"></span>
          <Flame className="w-4 h-4 text-rose-500" />
          <span>💥 傷亡破壞</span>
        </button>

        {/* 🟢 安全半徑 */}
        <button
          onClick={() => setShowRadius(!showRadius)}
          className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all text-xs ${
            showRadius
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>🟢 範圍圈</span>
        </button>
      </div>
    </div>
  );
}
