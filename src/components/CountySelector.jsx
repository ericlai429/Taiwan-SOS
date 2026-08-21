import React, { useState } from 'react';
import { MapPin, Globe } from 'lucide-react';
import countiesData from '../data/counties.json';
import Tooltip from './Tooltip';

// 5 大輪播區域與視角座標/縮放率
const REGION_CYCLES = [
  { id: 'all', name: '🌏 全區', label: '全台灣總覽', lat: 23.8, lng: 121.0, zoom: 7.5 },
  { id: 'north', name: '🏙️ 北區', label: '北部地區 (雙北/基桃園/竹/宜)', lat: 25.0478, lng: 121.5170, zoom: 11 },
  { id: 'central', name: '🏔️ 中區', label: '中部地區 (台中/苗彰/南投/雲)', lat: 24.1477, lng: 120.6736, zoom: 10.5 },
  { id: 'south', name: '🌴 南區', label: '南部地區 (台南/高雄/嘉/屏)', lat: 22.6273, lng: 120.3014, zoom: 10.5 },
  { id: 'east', name: '🌊 東區', label: '東部地區 (花蓮/台東)', lat: 23.5, lng: 121.3, zoom: 9.5 }
];

export default function CountySelector({ selectedCountyId, onSelectCounty, onSelectRegion, btnLevel = 3 }) {
  const [regionIndex, setRegionIndex] = useState(0);

  // 輪流切換區域 (全區 -> 北區 -> 中區 -> 南區 -> 東區 -> 循環)
  const handleCycleRegion = () => {
    const nextIdx = (regionIndex + 1) % REGION_CYCLES.length;
    setRegionIndex(nextIdx);
    const targetRegion = REGION_CYCLES[nextIdx];
    if (onSelectRegion) {
      onSelectRegion(targetRegion);
    }
  };

  const currentRegion = REGION_CYCLES[regionIndex];
  const isMicro = btnLevel <= 2;

  return (
    <div className="flex items-center gap-1.5 bg-slate-900/95 border border-slate-700 rounded-xl p-1.5 backdrop-blur-md shadow-lg">
      {/* 🔄 地區單鍵輪播按鈕 (支援 5 級距與 Tooltip 浮窗提示) */}
      <Tooltip text={`地區輪播：當前【${currentRegion.label}】(點擊輪播)`} position="right">
        <button
          onClick={handleCycleRegion}
          className={`bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 border border-purple-400 text-white font-black shadow-md flex items-center justify-center active:scale-95 transition-all shrink-0 ${
            btnLevel === 1 ? 'w-[25px] h-[25px] p-0 text-[10px] rounded-lg' :
            btnLevel === 2 ? 'w-[33px] h-[33px] p-1 text-xs rounded-xl' :
            btnLevel === 3 ? 'h-[36px] px-2 py-1 text-xs rounded-xl gap-1' :
            btnLevel === 4 ? 'h-[42px] px-2.5 py-1.5 text-xs rounded-xl gap-1' :
            'h-[50px] px-3 py-2 text-senior-sm rounded-2xl font-black gap-1'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-amber-300 animate-spin-slow shrink-0" />
          {!isMicro && <span className="whitespace-nowrap">{currentRegion.name}</span>}
        </button>
      </Tooltip>

      {/* 22 縣市細分下拉選單 */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 hidden sm:inline" />
        <select
          value={selectedCountyId || ''}
          onChange={(e) => {
            const found = countiesData.find(c => c.id === e.target.value);
            if (found) onSelectCounty(found);
          }}
          className="w-full bg-slate-800 text-amber-300 font-extrabold text-xs sm:text-senior-sm rounded-lg px-1.5 py-1 border border-slate-600 focus:outline-none cursor-pointer truncate"
        >
          <option value="" disabled>-- 全台 22 縣市/離島 --</option>
          {['離島', '北部', '中部', '南部', '東部'].map(group => (
            <optgroup key={group} label={`【${group}地區】`}>
              {countiesData.filter(c => c.region === group).map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}
