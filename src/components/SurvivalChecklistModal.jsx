import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckSquare, Square, X, RefreshCw } from 'lucide-react';

const DEFAULT_ITEMS = [
  { id: 'item-1', text: '💧 飲用水 (每人每日 3 公升，至少預備 3 天份)', checked: false },
  { id: 'item-2', text: '🍞 高熱量乾糧、軍用口糧與戰備罐頭', checked: false },
  { id: 'item-3', text: '💊 長輩個人慢性病藥品 (至少 7 天份) 與止血急救包', checked: false },
  { id: 'item-4', text: '🔦 支架手電筒與高容量備用電池', checked: false },
  { id: 'item-5', text: '📄 身分證件影本、健保卡與少量緊急現金', checked: false },
  { id: 'item-6', text: '📻 可開關便攜式 FM/AM 收音機與哨子', checked: false },
  { id: 'item-7', text: '🧥 保暖防寒衣物、雨衣與厚底防穿刺鞋', checked: false }
];

export default function SurvivalChecklistModal({ isOpen, onClose }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('taiwan_safe_survival_checklist');
      return saved ? JSON.parse(saved) : DEFAULT_ITEMS;
    } catch (e) {
      return DEFAULT_ITEMS;
    }
  });

  useEffect(() => {
    localStorage.setItem('taiwan_safe_survival_checklist', JSON.stringify(items));
  }, [items]);

  if (!isOpen) return null;

  const toggleCheck = (id) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const resetAll = () => {
    setItems(DEFAULT_ITEMS);
  };

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-emerald-500 rounded-3xl p-5 max-w-lg w-full text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-senior-lg">
            <ShoppingBag className="w-8 h-8 text-emerald-400" />
            <span>家庭緊急避難包準備清單</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800">
            <X className="w-7 h-7" />
          </button>
        </div>

        <div className="flex items-center justify-between bg-slate-800 p-3 rounded-2xl border border-slate-700">
          <span className="text-senior-base font-bold text-slate-200">
            整備完成度：<strong className="text-emerald-300">{checkedCount} / {items.length} 項</strong>
          </span>
          <button
            onClick={resetAll}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 重置清單
          </button>
        </div>

        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                item.checked
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {item.checked ? (
                <CheckSquare className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-7 h-7 text-slate-500 shrink-0 mt-0.5" />
              )}
              <span className={`text-senior-base font-extrabold leading-snug ${item.checked ? 'line-through opacity-80' : ''}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-senior-base rounded-2xl shadow-lg active:scale-95"
        >
          完成對照關閉
        </button>
      </div>
    </div>
  );
}
