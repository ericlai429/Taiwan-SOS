import React, { useState, useMemo } from 'react';
import { Search, Volume2, PhoneCall, Navigation, Shield, PackageCheck, Building2, Flame, Landmark, Stethoscope } from 'lucide-react';
import { filterWithinRadius, formatDistance } from '../services/geo';

import sheltersData from '../data/shelters.json';
import medicalData from '../data/medical.json';
import suppliesData from '../data/supplies.json';
import facilitiesData from '../data/facilities.json';

export default function ResourceList({ userLocation, onSelectDestination, btnLevel = 3 }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [activeCategory, setActiveCategory] = useState('all');

  // 根據 5 級距按鈕切換，動態調整字體、字號與按鈕大小
  const getScaleConfig = (level) => {
    switch (level) {
      case 1:
        return {
          titleClass: 'text-sm font-black',
          cardTitleClass: 'text-sm font-black',
          bodyClass: 'text-xs text-slate-300',
          noteClass: 'text-[11px] text-slate-400',
          btnClass: 'py-1 px-2 text-[11px] font-bold rounded-lg',
          cardPadding: 'p-2.5 space-y-1.5',
          inputClass: 'py-1.5 px-3 text-xs'
        };
      case 2:
        return {
          titleClass: 'text-base font-black',
          cardTitleClass: 'text-base font-black',
          bodyClass: 'text-xs sm:text-sm text-slate-300',
          noteClass: 'text-xs text-slate-400',
          btnClass: 'py-1.5 px-2.5 text-xs font-bold rounded-xl',
          cardPadding: 'p-3 space-y-2',
          inputClass: 'py-2 px-3 text-xs sm:text-sm'
        };
      case 3:
        return {
          titleClass: 'text-lg font-black',
          cardTitleClass: 'text-lg font-black',
          bodyClass: 'text-sm sm:text-base text-slate-300',
          noteClass: 'text-xs sm:text-sm text-slate-400',
          btnClass: 'py-2 px-3 text-sm font-bold rounded-xl',
          cardPadding: 'p-3.5 space-y-2.5',
          inputClass: 'py-2.5 px-3.5 text-sm'
        };
      case 4:
        return {
          titleClass: 'text-senior-lg font-extrabold',
          cardTitleClass: 'text-senior-lg font-extrabold',
          bodyClass: 'text-senior-base text-slate-300',
          noteClass: 'text-senior-sm text-slate-400',
          btnClass: 'py-2.5 px-3.5 text-senior-sm font-black rounded-2xl',
          cardPadding: 'p-4 space-y-3',
          inputClass: 'py-3 px-4 text-senior-base'
        };
      case 5:
        return {
          titleClass: 'text-senior-xl font-black',
          cardTitleClass: 'text-senior-xl font-black',
          bodyClass: 'text-senior-lg text-slate-200 font-bold',
          noteClass: 'text-senior-base text-slate-300',
          btnClass: 'py-3.5 px-4 text-senior-base font-black rounded-2xl',
          cardPadding: 'p-5 space-y-3.5',
          inputClass: 'py-3.5 px-4 text-senior-lg'
        };
      default:
        return {
          titleClass: 'text-lg font-black',
          cardTitleClass: 'text-lg font-black',
          bodyClass: 'text-sm sm:text-base text-slate-300',
          noteClass: 'text-xs sm:text-sm text-slate-400',
          btnClass: 'py-2 px-3 text-sm font-bold rounded-xl',
          cardPadding: 'p-3.5 space-y-2.5',
          inputClass: 'py-2.5 px-3.5 text-sm'
        };
    }
  };

  const scale = getScaleConfig(btnLevel);

  // 整合所有避難點位、派出所、消防隊、活動中心與外科診所
  const allResources = useMemo(() => {
    const s = sheltersData.map(i => ({ ...i, cat: 'shelter', icon: Shield, catName: '防空避難', catColor: 'bg-emerald-800 text-emerald-200 border-emerald-600' }));
    const p = suppliesData.map(i => ({ ...i, cat: 'supplies', icon: PackageCheck, catName: '物資發放', catColor: 'bg-amber-800 text-amber-200 border-amber-600' }));

    const f = facilitiesData.map(i => {
      if (i.type === 'police') return { ...i, cat: 'police', icon: Building2, catName: '派出所/分局', catColor: 'bg-blue-800 text-blue-200 border-blue-600' };
      if (i.type === 'fire') return { ...i, cat: 'fire', icon: Flame, catName: '消防隊/分隊', catColor: 'bg-orange-800 text-orange-200 border-orange-600' };
      if (i.type === 'community') return { ...i, cat: 'community', icon: Landmark, catName: '圖書館/活動中心', catColor: 'bg-purple-800 text-purple-200 border-purple-600' };
      if (i.type === 'local_clinic') return { ...i, cat: 'local_clinic', icon: Stethoscope, catName: '外科診所/醫院', catColor: 'bg-teal-800 text-teal-200 border-teal-600' };
      return { ...i, cat: 'other', icon: Shield, catName: '公共設施', catColor: 'bg-slate-800 text-slate-200 border-slate-600' };
    });

    const m = medicalData.map(i => ({ ...i, cat: 'medical', icon: Stethoscope, catName: '創傷急診醫院', catColor: 'bg-rose-800 text-rose-200 border-rose-600' }));

    return [...s, ...p, ...f, ...m];
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
    <div className="max-w-2xl mx-auto p-3 sm:p-4 pb-28 space-y-3">
      {/* 頂部控制：半徑選擇 (3km / 5km) 與搜尋 */}
      <div className="bg-slate-900/95 border-2 border-slate-700 rounded-3xl p-3.5 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className={`${scale.titleClass} text-amber-300 flex items-center gap-1.5`}>
            <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 shrink-0" />
            <span>派出所、消防隊與外科診所名冊</span>
          </h2>

          {/* 3km / 5km 切換按鈕 */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-700 shrink-0">
            <button
              onClick={() => setRadiusKm(3)}
              className={`px-2.5 py-1 rounded-xl font-black text-xs transition-all ${
                radiusKm === 3
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3 公里內
            </button>
            <button
              onClick={() => setRadiusKm(5)}
              className={`px-2.5 py-1 rounded-xl font-black text-xs transition-all ${
                radiusKm === 5
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              5 公里內
            </button>
          </div>
        </div>

        {/* 搜尋框 (自適應字號) */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋派出所、消防隊、外科診所或活動中心..."
            className={`w-full bg-slate-950 border-2 border-slate-700 rounded-2xl pl-10 pr-3 text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none ${scale.inputClass}`}
          />
        </div>

        {/* 分類切換標籤 */}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {[
            { id: 'all', label: '全部' },
            { id: 'police', label: '👮 派出所' },
            { id: 'fire', label: '🚒 消防隊' },
            { id: 'medical', label: '🏥 創傷醫院' },
            { id: 'local_clinic', label: '🩺 外科診所' },
            { id: 'supplies', label: '📦 物資水包' },
            { id: 'shelter', label: '🛡️ 防空避難' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`py-1 px-2.5 rounded-xl font-bold text-xs transition-all border ${
                activeCategory === c.id
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md font-black'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 清單結果卡片 (全面匹配 5 級距按鈕切換) */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/60 rounded-3xl border border-slate-800">
            <p className={`${scale.bodyClass} text-slate-400`}>目前尚無符合 {radiusKm} 公里內的據點</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const distText = formatDistance(item.distanceKm);
            return (
              <div
                key={item.id}
                className={`bg-slate-900/90 border-2 border-slate-700 hover:border-amber-500/60 rounded-3xl shadow-xl transition-all ${scale.cardPadding}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black border mb-1 ${item.catColor}`}>
                      {item.catName}
                    </span>
                    <h3 className={`${scale.cardTitleClass} text-white`}>{item.name}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-0.5 bg-slate-950 border border-emerald-500/80 rounded-2xl text-xs font-black text-emerald-400 shadow">
                      {distText}
                    </span>
                  </div>
                </div>

                <p className={scale.bodyClass}>
                  📍 <strong>地址：</strong>{item.address}
                </p>

                {item.phone && (
                  <p className={`${scale.bodyClass} font-bold text-cyan-300 flex items-center gap-1.5`}>
                    📞 <strong>直撥電話：</strong>
                    <a href={`tel:${item.phone}`} className="underline text-amber-300 hover:text-amber-200">
                      {item.phone}
                    </a>
                  </p>
                )}

                {item.notes && (
                  <p className={`${scale.noteClass} bg-slate-950/80 p-2 rounded-xl border border-slate-800`}>
                    💡 {item.notes}
                  </p>
                )}

                {/* 按鈕組 (朗讀、撥電話、開始導航 - 匹配 5 級距按鈕切換) */}
                <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-800">
                  <button
                    onClick={() => speakInfo(item)}
                    className={`flex-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/50 flex items-center justify-center gap-1 active:scale-95 ${scale.btnClass}`}
                  >
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>朗讀</span>
                  </button>

                  {item.phone && (
                    <a
                      href={`tel:${item.phone}`}
                      className={`flex-1 bg-rose-950 hover:bg-rose-900 text-white border border-rose-600 flex items-center justify-center gap-1 active:scale-95 text-center ${scale.btnClass}`}
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                      <span>撥電話</span>
                    </a>
                  )}

                  <button
                    onClick={() => onSelectDestination(item)}
                    className={`flex-[1.5] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md flex items-center justify-center gap-1 active:scale-95 border border-emerald-400 ${scale.btnClass}`}
                  >
                    <Navigation className="w-3.5 h-3.5 shrink-0" />
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
