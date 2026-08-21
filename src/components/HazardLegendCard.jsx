import React, { useState } from 'react';
import { Layers, Droplets, Ban, Flame, ShieldCheck, Skull, AlertOctagon, Waves, ChevronDown, ChevronUp, Shield, Stethoscope, PackageCheck, Building2 } from 'lucide-react';

export default function HazardLegendCard({
  showShelters, setShowShelters,
  showMedical, setShowMedical,
  showSupplies, setShowSupplies,
  showFacilities, setShowFacilities,
  showUtility, setShowUtility,
  showBlockade, setShowBlockade,
  showCasualty, setShowCasualty,
  showRadius, setShowRadius,
  showInvasion, setShowInvasion,
  showMissile, setShowMissile,
  showCoastal, setShowCoastal
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-900/95 border-2 border-slate-700 rounded-2xl shadow-xl backdrop-blur-md text-senior-sm text-white overflow-hidden">
      {/* 頂部標頭與展開/收合切換 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between font-black text-amber-400 text-xs sm:text-senior-base bg-slate-900/90 active:bg-slate-800"
      >
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>避難據點與災害敵情圖層</span>
          <span className="text-[10px] text-slate-400 font-normal">
            ({isExpanded ? '點擊折疊' : '點擊切換 11 大圖層開關'})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-amber-400 animate-bounce-short" />
        )}
      </button>

      {/* 展開後的 11 大圖層按鈕 */}
      {isExpanded && (
        <div className="p-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-1.5 animate-fadeIn">
          {/* 🛡️ 安全避難 */}
          {setShowShelters && (
            <button
              onClick={() => setShowShelters(!showShelters)}
              className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all text-xs ${
                showShelters
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md font-black'
                  : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>🛡️ 安全避難</span>
            </button>
          )}

          {/* 🏥 醫療急救 */}
          {setShowMedical && (
            <button
              onClick={() => setShowMedical(!showMedical)}
              className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all text-xs ${
                showMedical
                  ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md font-black'
                  : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-rose-400 shrink-0" />
              <span>🏥 醫療急救</span>
            </button>
          )}

          {/* 📦 戰備物資 */}
          {setShowSupplies && (
            <button
              onClick={() => setShowSupplies(!showSupplies)}
              className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all text-xs ${
                showSupplies
                  ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md font-black'
                  : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <PackageCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>📦 戰備物資</span>
            </button>
          )}

          {/* 👮 警消診所 */}
          {setShowFacilities && (
            <button
              onClick={() => setShowFacilities(!showFacilities)}
              className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all text-xs ${
                showFacilities
                  ? 'bg-blue-950 border-blue-500 text-blue-300 shadow-md font-black'
                  : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>👮 警消診所</span>
            </button>
          )}

          {/* 😈 敵佔領區 */}
          <button
            onClick={() => setShowInvasion(!showInvasion)}
            className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all text-xs ${
              showInvasion
                ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-md font-black'
                : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
            }`}
          >
            <Skull className="w-4 h-4 text-purple-400 shrink-0" />
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
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
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
            <Waves className="w-4 h-4 text-orange-400 shrink-0" />
            <span>🌊 沿海與海灘</span>
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
            <Droplets className="w-4 h-4 text-[#c2b280] shrink-0" />
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
            <Ban className="w-4 h-4 text-orange-400 shrink-0" />
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
            <Flame className="w-4 h-4 text-rose-500 shrink-0" />
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
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>🟢 5km 範圍圈</span>
          </button>
        </div>
      )}
    </div>
  );
}
