import React, { useState, useMemo } from 'react';
import { Search, Volume2, PhoneCall, Navigation, Shield, HeartPulse, PackageCheck, Building2, Flame, Landmark, Stethoscope } from 'lucide-react';
import { filterWithinRadius, formatDistance } from '../services/geo';

import sheltersData from '../data/shelters.json';
import medicalData from '../data/medical.json';
import suppliesData from '../data/supplies.json';
import facilitiesData from '../data/facilities.json';
import CountySelector from './CountySelector';

export default function ResourceList({ userLocation, onSelectDestination }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [radiusKm, setRadiusKm] = useState(5); // 3km 或 5km 半徑選擇
  const [activeCategory, setActiveCategory] = useState('all');

  // 整合所有避難點位、派出所、消防隊、活動中心與外科診所
  const allResources = useMemo(() => {
    const s = sheltersData.map(i => ({ ...i, cat: 'shelter', icon: Shield, catName: '防空避難', catColor: 'bg-emerald-800 text-emerald-200 border-emerald-600' }));
    const p = suppliesData.map(i => ({ ...i, cat: 'supplies', icon: PackageCheck, catName: '物資發放', catColor: 'bg-amber-800 text-amber-200 border-amber-600' }));
    
    // 派出所、消防隊、圖書館、外科診所
    const f = facilitiesData.map(i => {
      if (i.type === 'police') return { ...i, cat: 'police', icon: Building2, catName: '派出所/分局', catColor: 'bg-blue-800 text-blue-200 border-blue-600' };
      if (i.type === 'fire') return { ...i, cat: 'fire', icon: Flame, catName: '消防隊/分隊', catColor: 'bg-orange-800 text-orange-200 border-orange-600' };
      if (i.type === 'community') return { ...i, cat: 'community', icon: Landmark, catName: '圖書館/活動中心', catColor: 'bg-purple-800 text-purple-200 border-purple-600' };
      if (i.type === 'local_clinic') return { ...i, cat: 'local_clinic', icon: Stethoscope, catName: '外科診所/中小型醫院', catColor: 'bg-teal-800 text-teal-200 border-teal-600' };
      return { ...i, cat: 'other', icon: Shield, catName: '公共設施', catColor: 'bg-slate-800 text-slate-200 border-slate-600' };
    });

    return [...s, ...p, ...f];
  }, []);

  // 半徑 (3km or 5km) 與關鍵字過濾
  const filteredItems = useMemo(() => {
    let list = userLocation
      ? filterWithinRadius(allResources, userLocation.lat, userLocation.lng, radiusKm)
      : allResources;

    if (activeCategory !== 'all') {
      list = list.filter(item => item.cat === activeCategory);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        (item.city && item.city.toLowerCase().includes(q)) ||
        (item.district && item.district.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allResources, userLocation, radiusKm, activeCategory, searchTerm]);

  const speakInfo = (item) => {
    if (!('speechSynthesis' in window)) {
      alert('您的瀏覽器不支援語音朗讀功能');
      return;
    }
    window.speechSynthesis.cancel();
    const text = `${item.name}，地址位於 ${item.address}。電話：${item.phone || '無'}。${item.notes || ''}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28 space-y-4">
      {/* 頂部控制：半徑選擇 (3km / 5km) 與搜尋 */}
      <div className="bg-slate-800/90 border-2 border-slate-700 rounded-3xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-senior-lg font-extrabold text-amber-300 flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-teal-400" />
            <span>派出所、消防隊與外科診所聯絡</span>
          </h2>

          {/* 3km / 5km 切換按鈕 */}
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-700 shrink-0">
            <button
              onClick={() => setRadiusKm(3)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs sm:text-senior-sm transition-all ${
                radiusKm === 3
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3 公里內
            </button>
            <button
              onClick={() => setRadiusKm(5)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs sm:text-senior-sm transition-all ${
                radiusKm === 5
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              5 公里內
            </button>
          </div>
        </div>

        {/* 搜尋框 */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-6 h-6 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋派出所、消防隊、外科診所或活動中心..."
            className="w-full bg-slate-900 border-2 border-slate-600 rounded-2xl pl-12 pr-4 py-3 text-senior-base text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* 分類切換標籤 */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { id: 'all', label: '全部' },
            { id: 'police', label: '👮 派出所' },
            { id: 'fire', label: '🚒 消防隊' },
            { id: 'local_clinic', label: '🩺 外科診所' },
            { id: 'community', label: '🏛️ 活動中心' },
            { id: 'shelter', label: '🛡️ 避難所' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`py-1.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
                activeCategory === c.id
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md font-black'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 清單結果 */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/40 rounded-3xl border border-slate-700">
            <p className="text-senior-lg text-slate-400">目前尚無符合 {radiusKm} 公里內的據點</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const distText = formatDistance(item.distanceKm);
            return (
              <div
                key={item.id}
                className="bg-slate-800/90 border-2 border-slate-700 hover:border-amber-500/60 rounded-3xl p-4 shadow-xl transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-black border mb-1 ${item.catColor}`}>
                      {item.catName}
                    </span>
                    <h3 className="text-senior-lg font-extrabold text-white">{item.name}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-3 py-1 bg-slate-900 border border-emerald-500/80 rounded-2xl text-senior-base font-black text-emerald-400 shadow">
                      {distText}
                    </span>
                  </div>
                </div>

                <p className="text-senior-base text-slate-300">
                  📍 <strong>地址：</strong>{item.address}
                </p>

                {item.phone && (
                  <p className="text-senior-base font-bold text-cyan-300 flex items-center gap-2">
                    📞 <strong>直撥電話：</strong>
                    <a href={`tel:${item.phone}`} className="underline text-amber-300 hover:text-amber-200">
                      {item.phone}
                    </a>
                  </p>
                )}

                {item.notes && (
                  <p className="text-senior-sm text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700">
                    💡 {item.notes}
                  </p>
                )}

                {/* 按鈕組 (語音朗讀、撥打電話、導航) */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/80">
                  <button
                    onClick={() => speakInfo(item)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-cyan-300 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm border border-cyan-500/50 active:scale-95"
                  >
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>朗讀</span>
                  </button>

                  {item.phone && (
                    <a
                      href={`tel:${item.phone}`}
                      className="flex-1 bg-rose-900/80 hover:bg-rose-800 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm border border-rose-600 active:scale-95 text-center"
                    >
                      <PhoneCall className="w-4 h-4 text-rose-300" />
                      <span>撥電話</span>
                    </a>
                  )}

                  <button
                    onClick={() => onSelectDestination(item)}
                    className="flex-[1.5] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-sm shadow-md active:scale-95 border border-emerald-400"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>開始導航前往</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
