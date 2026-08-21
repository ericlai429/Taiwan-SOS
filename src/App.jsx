import React, { useState, useEffect } from 'react';
import SeniorNavbar from './components/SeniorNavbar';
import SafeMap from './components/SafeMap';
import ResourceList from './components/ResourceList';
import CipherChat from './components/CipherChat';
import HeartbeatSOS from './components/HeartbeatSOS';
import SOSFlashlightModal from './components/SOSFlashlightModal';
import SirenAudioModal from './components/SirenAudioModal';
import SurvivalChecklistModal from './components/SurvivalChecklistModal';
import { getStoredCipherCode, clearAllCacheAndStorage } from './services/storage';
import { Shield, Phone, Lock, Calendar, Zap, Radio, ShoppingBag, RotateCcw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [cipherCode, setCipherCode] = useState('');
  const [selectedTarget, setSelectedTarget] = useState(null);

  // 緊急民防工具 Modal 狀態
  const [isFlashlightOpen, setIsFlashlightOpen] = useState(false);
  const [isSirenOpen, setIsSirenOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  useEffect(() => {
    const saved = getStoredCipherCode();
    if (saved) setCipherCode(saved);
  }, []);

  const handleSelectDestination = (target) => {
    setSelectedTarget(target);
    setActiveTab('map');
  };

  const todayStr = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const handleResetData = async () => {
    if (window.confirm('確定要清空所有網頁暫存與舊資料嗎？此操作將清除離線快取並重新載入最新網頁。')) {
      await clearAllCacheAndStorage();
      window.location.reload(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-20">
      {/* 頂部長輩高對比標頭 (單行防折疊與防止直向排版錯亂) */}
      <header className="bg-slate-900 border-b border-slate-800 px-3 py-2 sticky top-0 z-50 shadow-md backdrop-blur-md bg-slate-900/95">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-1.5 h-10">
          {/* 左側標題：極致單行，嚴禁直向折字 */}
          <div className="flex items-center gap-2 shrink-0">
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

          {/* 右側工具列：精簡圖示按鈕，防止擠壓左側標題 */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleResetData}
              className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 rounded-xl border border-slate-700 text-xs font-bold active:scale-95 transition-all"
              title="重置暫存"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setIsFlashlightOpen(true)}
              className="p-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 rounded-xl border border-amber-600 text-xs font-bold active:scale-95"
              title="手電筒"
            >
              <Zap className="w-4 h-4 text-amber-400" />
            </button>

            <button
              onClick={() => setIsSirenOpen(true)}
              className="p-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded-xl border border-cyan-600 text-xs font-bold active:scale-95"
              title="警報試聽"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => setIsChecklistOpen(true)}
              className="p-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-xl border border-emerald-600 text-xs font-bold active:scale-95"
              title="避難包"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
            </button>

            <a
              href="tel:119"
              className="bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow active:scale-95 border border-rose-400 whitespace-nowrap ml-1"
            >
              <Phone className="w-3.5 h-3.5" /> 119
            </a>
          </div>
        </div>
      </header>

      {/* 主頁面內容 */}
      <main className="flex-1 w-full max-w-4xl mx-auto">
        {activeTab === 'map' && (
          <SafeMap
            cipherCode={cipherCode}
            onSelectDestination={handleSelectDestination}
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

      {/* 導覽列 */}
      <SeniorNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
