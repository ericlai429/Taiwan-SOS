import React, { useState, useEffect } from 'react';
import { ShieldCheck, Share2, Copy, Battery, MapPin, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { saveMessage } from '../services/storage';
import { networkSync } from '../services/networkSync';

export default function HeartbeatSOS({ userLocation, cipherCode }) {
  const [batteryLevel, setBatteryLevel] = useState('100%');
  const [safeStatus, setSafeStatus] = useState('safe'); // safe, need_help, in_shelter
  const [lastCheckin, setLastCheckin] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    networkSync.setChannel(cipherCode);
  }, [cipherCode]);

  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(`${Math.round(battery.level * 100)}%`);
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(`${Math.round(battery.level * 100)}%`);
        });
      });
    }
  }, []);

  const generateReportText = () => {
    const timeStr = new Date().toLocaleString('zh-TW', { hour12: false });
    const statusLabel =
      safeStatus === 'safe' ? '🟢 目前完全平安' :
      safeStatus === 'in_shelter' ? '🛡️ 已抵達避難所安頓' : '⚠️ 需要急救/物資協助';

    const coords = userLocation
      ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
      : '無法取得精確定位';

    return `🟢【雙北桃園民防平安心跳回報】\n時間：${timeStr}\n狀態：${statusLabel}\n座標：${coords}\n裝置剩餘電量：${batteryLevel}\n地圖開啟：https://maps.google.com/?q=${userLocation ? userLocation.lat : 25.0478},${userLocation ? userLocation.lng : 121.5170}`;
  };

  const handleCheckin = () => {
    const text = generateReportText();
    setLastCheckin(new Date().toLocaleTimeString());

    const hbMsg = {
      id: 'hb-' + Date.now(),
      sender: '長輩平安心跳',
      text: text,
      isEncrypted: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // 自動廣播至群組對話與跨裝置 MQTT 網路
    saveMessage(hbMsg);
    networkSync.broadcast('CHAT_MESSAGE', hbMsg);

    navigator.clipboard.writeText(text);
    setCopiedText('✅ 已紀錄平安心跳並自動複製訊息！可隨時貼上至 LINE 發送給親友。');
    setTimeout(() => setCopiedText(''), 4000);
  };

  const handleShareMap = () => {
    const shareText = `🗺️【暫時安全地區地圖 sharing】\n親友我目前位於安全區 (${userLocation ? userLocation.lat.toFixed(4) : 25.0478}, ${userLocation ? userLocation.lng.toFixed(4) : 121.5170})，周邊 5 公里避難所與醫療資源已預載妥當。\n地圖查看：https://maps.google.com/?q=${userLocation ? userLocation.lat : 25.0478},${userLocation ? userLocation.lng : 121.5170}`;

    if (navigator.share) {
      navigator.share({
        title: '雙北桃園安全地圖傳送',
        text: shareText,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      setCopiedText('✅ 暫時安全地圖訊息已複製至剪貼簿！');
      setTimeout(() => setCopiedText(''), 4000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28 space-y-5">
      {/* 核心大按鈕：平安心跳回報 */}
      <div className="bg-slate-800/90 border-4 border-green-500 rounded-3xl p-6 shadow-2xl text-center space-y-4">
        <h2 className="text-senior-2xl font-black text-green-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-10 h-10 text-green-400 animate-pulse" />
          <span>長輩一鍵平安心跳</span>
        </h2>

        <p className="text-senior-base text-slate-300">
          點擊下方大按鈕，自動紀錄時間、GPS 位置與電量，傳送平安簡訊給親友。
        </p>

        {/* 狀態切換 */}
        <div className="grid grid-cols-3 gap-2 py-2">
          <button
            onClick={() => setSafeStatus('safe')}
            className={`py-3 px-2 rounded-2xl font-extrabold text-senior-sm border-2 transition-all ${
              safeStatus === 'safe'
                ? 'bg-green-600 border-white text-white shadow-lg scale-105'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            🟢 完全平安
          </button>
          <button
            onClick={() => setSafeStatus('in_shelter')}
            className={`py-3 px-2 rounded-2xl font-extrabold text-senior-sm border-2 transition-all ${
              safeStatus === 'in_shelter'
                ? 'bg-emerald-600 border-white text-white shadow-lg scale-105'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            🛡️ 已在避難所
          </button>
          <button
            onClick={() => setSafeStatus('need_help')}
            className={`py-3 px-2 rounded-2xl font-extrabold text-senior-sm border-2 transition-all ${
              safeStatus === 'need_help'
                ? 'bg-amber-600 border-white text-white shadow-lg scale-105'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            ⚠️ 需物資協助
          </button>
        </div>

        {/* 觸控「我平安」按鈕 (調整極致精緻尺寸) */}
        <button
          onClick={handleCheckin}
          className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-xl rounded-2xl shadow-xl border-2 border-green-300 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <CheckCircle className="w-8 h-8 text-white" />
          <span>【我平安】回報心跳</span>
        </button>

        {lastCheckin && (
          <p className="text-senior-base text-emerald-300 font-bold">
            上次回報時間：{lastCheckin}
          </p>
        )}

        {copiedText && (
          <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-2xl text-emerald-300 text-senior-base font-bold animate-bounce">
            {copiedText}
          </div>
        )}
      </div>

      {/* 傳送暫時安全地圖 */}
      <div className="bg-slate-800/90 border-2 border-slate-700 rounded-3xl p-5 shadow-xl space-y-3">
        <h3 className="text-senior-xl font-extrabold text-white flex items-center gap-2">
          <Share2 className="w-7 h-7 text-cyan-400" />
          <span>傳送暫時安全地圖給親友</span>
        </h3>
        <p className="text-senior-base text-slate-300">
          生成當前安全圖資與位置摘要，直接發送給 LINE 或 SMS 連絡人。
        </p>

        <button
          onClick={handleShareMap}
          className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-senior-lg rounded-2xl shadow-lg border border-cyan-300 flex items-center justify-center gap-2 active:scale-95"
        >
          <Share2 className="w-6 h-6" />
          <span>一鍵傳送安全地圖訊息</span>
        </button>
      </div>

      {/* 裝置狀態卡 */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 flex items-center justify-between text-senior-base text-slate-300">
        <div className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-emerald-400" />
          <span>GPS 狀態：{userLocation ? '🟢 正常定位中' : '⚠️ 搜尋中'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Battery className="w-6 h-6 text-amber-400" />
          <span>剩餘電量：<strong className="text-white">{batteryLevel}</strong></span>
        </div>
      </div>
    </div>
  );
}
