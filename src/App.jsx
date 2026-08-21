import React, { useState, useEffect } from 'react';
import SeniorNavbar from './components/SeniorNavbar';
import SafeMap from './components/SafeMap';
import ResourceList from './components/ResourceList';
import CipherChat from './components/CipherChat';
import HeartbeatSOS from './components/HeartbeatSOS';
import SOSFlashlightModal from './components/SOSFlashlightModal';
import SirenAudioModal from './components/SirenAudioModal';
import SurvivalChecklistModal from './components/SurvivalChecklistModal';
import Tooltip from './components/Tooltip';
import { getStoredCipherCode, clearAllCacheAndStorage } from './services/storage';
import { Shield, Phone, Lock, Calendar, Zap, Radio, ShoppingBag, RotateCcw, Sliders } from 'lucide-react';

export const SIZE_LEVELS = [
  { level: 1, px: 25, label: '極小 25px', class: 'w-[25px] h-[25px] p-0 text-[10px] rounded-lg', showText: false },
  { level: 2, px: 33, label: '精簡 33px', class: 'w-[33px] h-[33px] p-1 text-xs rounded-xl', showText: false },
  { level: 3, px: 42, label: '標準 42px', class: 'h-[42px] px-2.5 py-2 text-xs rounded-xl', showText: true },
  { level: 4, px: 50, label: '大號 50px', class: 'h-[50px] px-3.5 py-2.5 text-senior-sm rounded-2xl', showText: true },
  { level: 5, px: 60, label: '特大 60px', class: 'h-[60px] px-4 py-3 text-senior-base rounded-2xl font-black', showText: true }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [cipherCode, setCipherCode] = useState('');
  const [selectedTarget, setSelectedTarget] = useState(null);

  // 5 個按鈕尺寸級距 (1: 25px, 2: 33px, 3: 42px, 4: 50px, 5: 60px)
  const [btnLevel, setBtnLevel] = useState(() => {
    const saved = localStorage.getItem('taiwan_sos_btn_level');
    return saved ? Number(saved) : 3;
  });

  // 緊急民防工具 Modal 狀態
  const [isFlashlightOpen, setIsFlashlightOpen] = useState(false);
  const [isSirenOpen, setIsSirenOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  useEffect(() => {
    const saved = getStoredCipherCode();
    if (saved) setCipherCode(saved);
  }, []);

  // 循環切換 5 個按鈕級距 (25px -> 33px -> 42px -> 50px -> 60px -> 輪播)
  const cycleBtnLevel = () => {
    const next = btnLevel >= 5 ? 1 : btnLevel + 1;
    setBtnLevel(next);
    localStorage.setItem('taiwan_sos_btn_level', String(next));
  };

  const currentLevelConfig = SIZE_LEVELS.find(l => l.level === btnLevel) || SIZE_LEVELS[2];

  const handleSelectDestination = (target) => {
    setSelectedTarget(target);
    setActiveTab('map');
  };

  const handleResetData = async () => {
    if (window.confirm('確定要清空所有網頁暫存與舊資料嗎？此操作將清除離線快取並重新載入最新網頁。')) {
      await clearAllCacheAndStorage();
      window.location.reload(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-20">
      {/* 頂部長輩高對比標頭 (嚴禁任何按鈕擠出螢幕) */}
      <header className="bg-slate-900 border-b border-slate-800 px-2 py-1.5 sticky top-0 z-50 shadow-md backdrop-blur-md bg-slate-900/95">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-1.5 h-10 overflow-hidden">
          {/* 左側標題 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="p-1.5 bg-emerald-600 rounded-xl shadow-md shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-base sm:text-senior-lg font-black tracking-wide text-white whitespace-nowrap shrink-0">
              台灣急難通
            </h1>
            {cipherCode && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-700">
                <Lock className="w-3 h-3" /> 暗碼
              </span>
            )}
          </div>

          {/* 右側工具列 (極致響應自適應，不擠出螢幕) */}
          <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar max-w-[65%] sm:max-w-none">
            {/* ⚙️ 5 級距按鈕切換鈕 */}
            <Tooltip text={`按鈕尺寸：當前【${currentLevelConfig.label}】(點擊切換)`} position="bottom">
              <button
                onClick={cycleBtnLevel}
                className="h-[34px] px-2 bg-purple-700 hover:bg-purple-600 border border-purple-400 text-white rounded-xl text-xs font-black flex items-center justify-center shrink-0 active:scale-95 transition-all"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden md:inline ml-1 whitespace-nowrap">{currentLevelConfig.px}px</span>
              </button>
            </Tooltip>

            {/* 🔄 重置暫存 */}
            <Tooltip text="重置暫存：清空舊資料與離線快取" position="bottom">
              <button
                onClick={handleResetData}
                className="h-[34px] w-[34px] bg-slate-800 hover:bg-rose-950 text-slate-300 rounded-xl border border-slate-700 flex items-center justify-center shrink-0 active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </Tooltip>

            {/* 🔦 手電筒 */}
            <Tooltip text="手電筒：極致白光與 SOS 爆閃燈" position="bottom">
              <button
                onClick={() => setIsFlashlightOpen(true)}
                className="h-[34px] w-[34px] bg-amber-950/80 hover:bg-amber-900 text-amber-300 rounded-xl border border-amber-600 flex items-center justify-center shrink-0 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </Tooltip>

            {/* 📻 警報試聽 */}
            <Tooltip text="警報試聽：防空警報聽力導引與音效" position="bottom">
              <button
                onClick={() => setIsSirenOpen(true)}
                className="h-[34px] w-[34px] bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded-xl border border-cyan-600 flex items-center justify-center shrink-0 active:scale-95"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </Tooltip>

            {/* 🎒 避難包 */}
            <Tooltip text="避難包：家庭避難備糧勾選清單" position="bottom">
              <button
                onClick={() => setIsChecklistOpen(true)}
                className="h-[34px] w-[34px] bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-xl border border-emerald-600 flex items-center justify-center shrink-0 active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </Tooltip>

            {/* 📞 119 */}
            <Tooltip text="119 直播：消防與急護報案電話" position="bottom">
              <a
                href="tel:119"
                className="h-[34px] px-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl border border-rose-400 text-xs font-black flex items-center justify-center shrink-0 active:scale-95 shadow"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="ml-1 text-xs">119</span>
              </a>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* 主頁面內容 */}
      <main className="flex-1 w-full max-w-4xl mx-auto">
        {activeTab === 'map' && (
          <SafeMap
            cipherCode={cipherCode}
            onSelectDestination={handleSelectDestination}
            btnLevel={btnLevel}
          />
        )}

        {activeTab === 'resources' && (
          <ResourceList
            onSelectDestination={handleSelectDestination}
          />
        )}

        {activeTab === 'chat' && (
          <CipherChat
            cipherCode={cipherCode}
            setCipherCode={setCipherCode}
          />
        )}

        {activeTab === 'heartbeat' && (
          <HeartbeatSOS
            cipherCode={cipherCode}
          />
        )}
      </main>

      {/* 導覽列 (匹配 5 級距按鈕尺寸切換) */}
      <SeniorNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        btnLevel={btnLevel}
      />

      {/* 應變工具 Modals */}
      <SOSFlashlightModal
        isOpen={isFlashlightOpen}
        onClose={() => setIsFlashlightOpen(false)}
      />

      <SirenAudioModal
        isOpen={isSirenOpen}
        onClose={() => setIsSirenOpen(false)}
      />

      <SurvivalChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
      />
    </div>
  );
}
