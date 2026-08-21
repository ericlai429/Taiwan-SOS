import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import countiesData from '../data/counties.json';

export default function CountySelector({ selectedCountyId, onSelectCounty }) {
  return (
    <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-xl p-1.5 backdrop-blur-md">
      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
      <select
        value={selectedCountyId || ''}
        onChange={(e) => {
          const found = countiesData.find(c => c.id === e.target.value);
          if (found) onSelectCounty(found);
        }}
        className="bg-slate-800 text-amber-300 font-extrabold text-xs sm:text-senior-sm rounded-lg px-2 py-1 border border-slate-600 focus:outline-none cursor-pointer"
      >
        <option value="" disabled>-- 切換全台 22 縣市/離島定位 --</option>
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
  );
}
