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

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [cipherCode, setCipherCode] = useState('');
  const [selectedTarget, setSelectedTarget] = useState(null);

  // 25px 極小按鈕模式設定狀態
  const [isMicro25, setIsMicro25] = useState(() => {
    return localStorage.getItem('taiwan_sos_micro25') === 'true';
  });

  // 緊急民防工具 Modal 狀態
  const [isFlashlightOpen, setIsFlashlightOpen] = useState(false);
  const [isSirenOpen, setIsSirenOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  useEffect(() => {
    const saved = getStoredCipherCode();
    if (saved) setCipherCode(saved);
  }, []);

  const toggleMicro25 = () => {
    const next = !isMicro25;
    setIsMicro25(next);
    localStorage.setItem('taiwan_sos_micro25', String(next));
  };

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
      {/* 頂部長輩高對比標頭 (支援 25px 極小按鈕組態) */}
      <header className="bg-slate-900 border-b border-slate-800 px-2 py-1.5 sticky top-0 z-50 shadow-md backdrop-blur-md bg-slate-900/95">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-1.5 h-10">
          {/* 左側標題 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="p-1 bg-emerald-600 rounded-xl shadow-md shrink-0">
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

          {/* 右側工具列 (支援 25px 極小模式與浮窗提示) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* ⚙️ 25px 極小按鈕組態切換 */}
            <Tooltip text={isMicro25 ? '切換為標準按鈕尺寸' : '切換為 25px 極小按鈕模式 (浮窗提示)'} position="bottom">
              <button
                onClick={toggleMicro25}
                className={`transition-all font-black flex items-center justify-center border active:scale-95 ${
                  isMicro25
                    ? 'w-[25px] h-[25px] p-0 bg-purple-600 border-white text-white rounded-lg'
                    : 'p-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border-purple-500 rounded-xl text-xs'
                }`}
              >
                <Sliders className={isMicro25 ? 'w-3.5 h-3.5 text-white' : 'w-4 h-4 text-purple-400'} />
              </button>
            </Tooltip>

            {/* 🔄 重置暫存 */}
            <Tooltip text="重置暫存：清空舊資料與離線快取" position="bottom">
              <button
                onClick={handleResetData}
                className={`transition-all font-bold flex items-center justify-center border active:scale-95 ${
                  isMicro25
                    ? 'w-[25px] h-[25px] p-0 bg-slate-800 border-slate-600 text-slate-300 rounded-lg'
                    : 'p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 rounded-xl border border-slate-700 text-xs'
                }`}
              >
                <RotateCcw className={isMicro25 ? 'w-3.5 h-3.5 text-slate-300' : 'w-4 h-4 text-slate-400'} />
              </button>
            </Tooltip>

            {/* 🔦 手電筒 */}
            <Tooltip text="手電筒：極致白光與 SOS 爆閃燈" position="bottom">
              <button
                onClick={() => setIsFlashlightOpen(true)}
                className={`transition-all font-bold flex items-center justify-center border active:scale-95 ${
                  isMicro25
                    ? 'w-[25px] h-[25px] p-0 bg-amber-950 border-amber-500 text-amber-400 rounded-lg'
                    : 'p-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 rounded-xl border border-amber-600 text-xs'
                }`}
              >
                <Zap className={isMicro25 ? 'w-3.5 h-3.5 text-amber-400' : 'w-4 h-4 text-amber-400'} />
              </button>
            </Tooltip>

            {/* 📻 警報試聽 */}
            <Tooltip text="警報試聽：防空警報聽力導引與音效" position="bottom">
              <button
                onClick={() => setIsSirenOpen(true)}
                className={`transition-all font-bold flex items-center justify-center border active:scale-95 ${
                  isMicro25
                    ? 'w-[25px] h-[25px] p-0 bg-cyan-950 border-cyan-500 text-cyan-400 rounded-lg'
                    : 'p-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded-xl border border-cyan-600 text-xs'
                }`}
              >
                <Radio className={isMicro25 ? 'w-3.5 h-3.5 text-cyan-400' : 'w-4 h-4 text-cyan-400'} />
              </button>
            </Tooltip>

            {/* 🎒 避難包 */}
            <Tooltip text="避難包：家庭避難備糧勾選清單" position="bottom">
              <button
                onClick={() => setIsChecklistOpen(true)}
                className={`transition-all font-bold flex items-center justify-center border active:scale-95 ${
                  isMicro25
                    ? 'w-[25px] h-[25px] p-0 bg-emerald-950 border-emerald-500 text-emerald-400 rounded-lg'
                    : 'p-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-xl border border-emerald-600 text-xs'
                }`}
              >
                <ShoppingBag className={isMicro25 ? 'w-3.5 h-3.5 text-emerald-400' : 'w-4 h-4 text-emerald-400'} />
              </button>
            </Tooltip>

            {/* 📞 119 */}
            <Tooltip text="119 直撥：消防與急護報案電話" position="bottom">
              <a
                href="tel:119"
                className={`bg-rose-600 hover:bg-rose-500 text-white font-black flex items-center justify-center shadow active:scale-95 border border-rose-400 whitespace-nowrap transition-all ${
                  isMicro25
                    ? 'w-[25px] h-[25px] p-0 rounded-lg text-[10px]'
                    : 'px-2 py-1 rounded-xl text-xs ml-1'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                {!isMicro25 && <span className="ml-1">119</span>}
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
            isMicro25={isMicro25}
            toggleMicro25={toggleMicro25}
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
