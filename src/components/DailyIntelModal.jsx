import React, { useState, useEffect } from 'react';
import { Calendar, Save, X } from 'lucide-react';
import { getDailyIntel, saveDailyIntel } from '../services/storage';

export default function DailyIntelModal({ isOpen, onClose }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [intelText, setIntelText] = useState('');
  const [savedStatus, setSavedStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      const existing = getDailyIntel(selectedDate);
      setIntelText(existing || '');
      setSavedStatus('');
    }
  }, [selectedDate, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveDailyIntel(selectedDate, intelText);
    setSavedStatus('✅ 已成功記錄當日地圖情報！');
    setTimeout(() => setSavedStatus(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      {/* 縮小 50% 的精簡每日情報 Modal 視窗 */}
      <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl p-3.5 max-w-sm w-full text-white shadow-2xl space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs sm:text-sm">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>每日地圖情報紀錄</span>
          </div>
          <button onClick={onClose} className="p-0.5 text-slate-400 hover:text-white rounded-full bg-slate-800 border border-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              選擇情報日期：
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-800 border border-amber-500/60 rounded-xl p-2 text-xs font-bold text-amber-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              【{selectedDate}】情報筆記：
            </label>
            <textarea
              value={intelText}
              onChange={(e) => setIntelText(e.target.value)}
              placeholder="在此紀錄今日道路狀況、避難處所開展、物資發放情形..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {savedStatus && (
            <div className="p-1.5 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-300 text-[11px] font-bold animate-pulse text-center">
              {savedStatus}
            </div>
          )}

          <div className="flex gap-1.5 text-[10px]">
            <button
              onClick={() => setIntelText(prev => prev + '\n- [情報] 本區避難設施通風正常，水井運作中。')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700 flex-1"
            >
              + 避難所範本
            </button>
            <button
              onClick={() => setIntelText(prev => prev + '\n- [物資] 於附近發放點成功領取戰備水罐。')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700 flex-1"
            >
              + 物資領取範本
            </button>
          </div>

          <div className="pt-1 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-1.5 rounded-xl font-bold text-xs text-slate-300"
            >
              關閉
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-amber-600 hover:bg-amber-500 py-1.5 rounded-xl font-bold text-xs text-slate-950 shadow-md flex items-center justify-center gap-1 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>儲存今日情報</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
