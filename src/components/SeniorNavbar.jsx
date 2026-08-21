import React from 'react';
import { Map, Package, Lock, ShieldCheck } from 'lucide-react';
import { useViewport } from '../services/useViewport';
import Tooltip from './Tooltip';

export default function SeniorNavbar({ activeTab, setActiveTab, btnLevel = 3 }) {
  const { isLandscape, isMobile } = useViewport();

  const tabs = [
    { id: 'map', label: '避難地圖', icon: Map, color: 'text-emerald-400' },
    { id: 'resources', label: '物資醫療', icon: Package, color: 'text-amber-400' },
    { id: 'chat', label: '暗碼群組', icon: Lock, color: 'text-cyan-400' },
    { id: 'heartbeat', label: '平安心跳', icon: ShieldCheck, color: 'text-green-400' }
  ];

  // 根據 5 級距 (動態按鈕尺寸再縮小 50%) 計算底部導覽列按鈕樣式
  const getNavBtnConfig = (level) => {
    switch (level) {
      case 1:
        return {
          minWidth: '32px',
          minHeight: '22px',
          iconClass: 'w-3 h-3',
          textClass: 'text-[8px]',
          containerClass: 'py-0 px-0.5 rounded-md gap-0',
          showText: true
        };
      case 2:
        return {
          minWidth: '40px',
          minHeight: '28px',
          iconClass: 'w-3.5 h-3.5',
          textClass: 'text-[9px]',
          containerClass: 'py-0.5 px-1 rounded-lg gap-0',
          showText: true
        };
      case 3:
        return {
          minWidth: '48px',
          minHeight: '34px',
          iconClass: 'w-4 h-4',
          textClass: 'text-[10px] font-bold',
          containerClass: 'py-0.5 px-1 rounded-lg gap-0.5',
          showText: true
        };
      case 4:
        return {
          minWidth: '56px',
          minHeight: '40px',
          iconClass: 'w-4.5 h-4.5',
          textClass: 'text-[11px] font-bold',
          containerClass: 'py-1 px-1.5 rounded-xl gap-0.5',
          showText: true
        };
      case 5:
        return {
          minWidth: '64px',
          minHeight: '46px',
          iconClass: 'w-5 h-5',
          textClass: 'text-xs font-black',
          containerClass: 'py-1 px-2 rounded-xl gap-0.5',
          showText: true
        };
      default:
        return {
          minWidth: '48px',
          minHeight: '34px',
          iconClass: 'w-4 h-4',
          textClass: 'text-[10px] font-bold',
          containerClass: 'py-0.5 px-1 rounded-lg gap-0.5',
          showText: true
        };
    }
  };

  const navCfg = getNavBtnConfig(btnLevel);

  // 橫向模式 (Landscape)
  if (isLandscape && isMobile) {
    return (
      <nav className="fixed top-0 bottom-0 left-0 z-[2500] bg-slate-900/95 border-r border-slate-800 backdrop-blur-md px-1 py-1 flex flex-col justify-center gap-1 shadow-2xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <Tooltip key={t.id} text={t.label} position="right">
              <button
                onClick={() => setActiveTab(t.id)}
                className={`flex flex-col items-center justify-center transition-all active:scale-95 ${navCfg.containerClass} ${
                  isActive
                    ? 'bg-slate-800 text-white font-bold border border-emerald-500 shadow-md scale-105'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
                style={{ minWidth: navCfg.minWidth, minHeight: navCfg.minHeight }}
              >
                <Icon className={`${navCfg.iconClass} ${isActive ? t.color : 'text-slate-400'}`} />
                {navCfg.showText && (
                  <span className={`leading-tight ${navCfg.textClass} ${isActive ? 'text-emerald-300 font-bold' : ''}`}>
                    {t.label}
                  </span>
                )}
              </button>
            </Tooltip>
          );
        })}
      </nav>
    );
  }

  // 直向模式 (Portrait)：精簡小型底部橫向導覽列 (按鈕尺寸縮小 50%，z-[2500] 防遮擋)
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[2500] bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-1 py-0.5">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <Tooltip key={t.id} text={t.label} position="top">
              <button
                onClick={() => setActiveTab(t.id)}
                className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${navCfg.containerClass} ${
                  isActive
                    ? 'bg-slate-800 text-white font-bold border border-emerald-500 shadow-md scale-105'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
                style={{ minWidth: navCfg.minWidth, minHeight: navCfg.minHeight }}
              >
                <Icon className={`${navCfg.iconClass} ${isActive ? t.color : 'text-slate-400'}`} />
                {navCfg.showText && (
                  <span className={`leading-tight ${navCfg.textClass} ${isActive ? 'text-emerald-300 font-bold' : ''}`}>
                    {t.label}
                  </span>
                )}
              </button>
            </Tooltip>
          );
        })}
      </div>
    </nav>
  );
}
