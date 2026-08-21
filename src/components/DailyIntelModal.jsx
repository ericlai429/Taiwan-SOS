import React, { useState, useEffect } from 'react';
import { Calendar, Save, X, BookOpen } from 'lucide-react';
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
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-amber-500 rounded-3xl p-5 max-w-lg w-full text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-senior-lg">
            <Calendar className="w-8 h-8 text-amber-400" />
            <span>每日地圖情報紀錄</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800">
            <X className="w-7 h-7" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-senior-sm font-bold text-slate-300 mb-1">
              選擇情報日期：
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-800 border-2 border-amber-500/60 rounded-2xl p-3 text-senior-lg font-bold text-amber-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-senior-sm font-bold text-slate-300 mb-1">
              【{selectedDate}】地圖情報與動態筆記：
            </label>
            <textarea
              value={intelText}
              onChange={(e) => setIntelText(e.target.value)}
              placeholder="在此紀錄今日 5km 內的道路狀況、避難處所開展、物資發放排隊情形與親友安全筆記..."
              rows={5}
              className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl p-3 text-senior-base text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {savedStatus && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-2xl text-emerald-300 text-senior-sm font-bold animate-pulse text-center">
              {savedStatus}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setIntelText(prev => prev + '\n- [情報] 今日本區防空避難設施通風正常，水井運作中。')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-senior-sm text-slate-300 border border-slate-700"
            >
              + 避難所範本
            </button>
            <button
              onClick={() => setIntelText(prev => prev + '\n- [物資] 10:00 於附近發放點成功領取戰備水罐與乾糧。')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-senior-sm text-slate-300 border border-slate-700"
            >
              + 物資領取範本
            </button>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-2xl font-bold text-senior-base text-slate-300"
            >
              關閉
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-amber-600 hover:bg-amber-500 py-3 rounded-2xl font-black text-senior-base text-slate-950 shadow-lg flex items-center justify-center gap-2 active:scale-95"
            >
              <Save className="w-5 h-5" />
              <span>儲存今日情報</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
