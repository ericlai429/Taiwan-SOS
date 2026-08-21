import React from 'react';
import { Map, Package, Lock, ShieldCheck } from 'lucide-react';
import { useViewport } from '../services/useViewport';

export default function SeniorNavbar({ activeTab, setActiveTab }) {
  const { isLandscape, isMobile } = useViewport();

  const tabs = [
    { id: 'map', label: '避難地圖', icon: Map, color: 'text-emerald-400' },
    { id: 'resources', label: '物資醫療', icon: Package, color: 'text-amber-400' },
    { id: 'chat', label: '暗碼群組', icon: Lock, color: 'text-cyan-400' },
    { id: 'heartbeat', label: '平安心跳', icon: ShieldCheck, color: 'text-green-400' }
  ];

  // 橫向模式 (Landscape)：自動轉為左側直立式精緻導覽列，放大地圖可視高度
  if (isLandscape && isMobile) {
    return (
      <nav className="fixed top-0 bottom-0 left-0 z-50 bg-slate-900/95 border-r border-slate-800 backdrop-blur-md px-1.5 py-2 flex flex-col justify-center gap-2 shadow-2xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'bg-slate-800 text-white font-bold border-2 border-emerald-500 shadow-md scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{ width: '56px', height: '52px' }}
              title={t.label}
            >
              <Icon className={`w-5 h-5 ${isActive ? t.color : 'text-slate-400'}`} />
              <span className={`mt-0.5 text-[11px] leading-tight ${isActive ? 'text-emerald-300 font-bold' : ''}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // 直向模式 (Portrait)：標準底部橫向導覽列
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-2 py-1.5">
      <div className="max-w-xl mx-auto flex justify-around items-center">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-slate-800 text-white font-bold border-2 border-emerald-500 shadow-md scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{ minWidth: '68px', minHeight: '52px' }}
            >
              <Icon className={`w-6 h-6 ${isActive ? t.color : 'text-slate-400'}`} />
              <span className={`mt-0.5 text-sm ${isActive ? 'text-emerald-300 font-bold' : ''}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
