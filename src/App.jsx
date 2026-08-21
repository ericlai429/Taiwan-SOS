import React, { useState, useEffect } from 'react';
import SeniorNavbar from './components/SeniorNavbar';
import SafeMap from './components/SafeMap';
import ResourceList from './components/ResourceList';
import CipherChat from './components/CipherChat';
import HeartbeatSOS from './components/HeartbeatSOS';
import SOSFlashlightModal from './components/SOSFlashlightModal';
import SirenAudioModal from './components/SirenAudioModal';
import SurvivalChecklistModal from './components/SurvivalChecklistModal';
import { getStoredCipherCode } from './services/storage';
import { Shield, Phone, Lock, Calendar, Zap, Radio, ShoppingBag } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-20">
      {/* 頂部長輩高對比標頭 */}
      <header className="bg-slate-900 border-b-2 border-slate-800 px-3 py-2.5 sticky top-0 z-50 shadow-lg backdrop-blur-md bg-slate-900/90">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 rounded-2xl shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-senior-base font-black tracking-wide text-white leading-tight">
                台灣急難通 <span className="text-xs text-amber-300 font-bold hidden sm:inline">(Taiwan SOS)</span>
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-bold hidden sm:inline">
                  <Calendar className="w-3.5 h-3.5" /> {todayStr}
                </span>
                {cipherCode && (
                  <span className="flex items-center gap-1 text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-700">
                    <Lock className="w-3 h-3" /> 暗碼對齊
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 頂部快捷應變工具與直撥電話 */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFlashlightOpen(true)}
              className="p-2 bg-amber-950/80 hover:bg-amber-900 text-amber-300 rounded-xl border border-amber-600 text-xs font-bold flex items-center gap-1 active:scale-95"
              title="手電筒與爆閃燈"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">手電筒</span>
            </button>

            <button
              onClick={() => setIsSirenOpen(true)}
              className="p-2 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded-xl border border-cyan-600 text-xs font-bold flex items-center gap-1 active:scale-95"
              title="防空警報試聽導引"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">警報試聽</span>
            </button>

            <button
              onClick={() => setIsChecklistOpen(true)}
              className="p-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-xl border border-emerald-600 text-xs font-bold flex items-center gap-1 active:scale-95"
              title="避難包對照表"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">避難包</span>
            </button>

            <a
              href="tel:119"
              className="bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1.5 rounded-xl text-sm font-extrabold flex items-center gap-1 shadow active:scale-95 border border-rose-400"
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
