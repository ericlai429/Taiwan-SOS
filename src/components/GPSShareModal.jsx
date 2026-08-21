import React, { useState } from 'react';
import { Navigation, Share2, Copy, Check, Wifi, X, MapPin } from 'lucide-react';

export default function GPSShareModal({ isOpen, onClose, userLocation }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 📌 GPS 座標一律修飾至小數點後 3 位 (toFixed(3))
  const lat = userLocation?.lat ? userLocation.lat.toFixed(3) : '25.065';
  const lng = userLocation?.lng ? userLocation.lng.toFixed(3) : '121.657';
  const accuracy = userLocation?.accuracy ? Math.round(userLocation.accuracy) : 8;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const appUrl = `https://ericlai429.github.io/Taiwan-SOS/`;

  const shareText = `🚨【台灣急難通 - 緊急位置通報】\n📍 我目前的定位座標：\n緯度：${lat}\n經度：${lng}\n(精準度：±${accuracy}公尺)\n\n🗺️ Google 地圖開啟：\n${googleMapsUrl}\n\n🛡️ 台灣急難通 避難網址：\n${appUrl}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '台灣急難通 - 我的緊急定位座標',
          text: shareText,
          url: googleMapsUrl
        });
      } catch (err) {
        console.warn('Share error or canceled:', err);
      }
    } else {
      handleCopyText();
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      {/* 縮小 50% 的精簡 Modal 視窗 */}
      <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl p-3.5 max-w-sm w-full shadow-2xl space-y-2.5 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-0.5 rounded-full bg-slate-800 border border-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 標題 (縮小 50%) */}
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Navigation className="w-4 h-4 animate-pulse" />
          <h3 className="text-sm font-extrabold tracking-wide text-white">GPS 座標分享與定位警示</h3>
        </div>

        {/* 溫馨提醒：開啟 Wi-Fi (縮小 50%) */}
        <div className="bg-amber-950/60 border border-amber-500/60 rounded-xl p-2 flex items-start gap-2">
          <Wifi className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-[10px] text-amber-200 leading-tight font-medium">
            <span className="text-amber-400 font-bold block">💡 精準度提醒：</span>
            請確定開啟 <strong className="text-white underline">Wi-Fi 與藍牙</strong>，可幫助手機定位提升至巷弄！
          </div>
        </div>

        {/* 當前座標顯示卡片 (小數點後 3 位, 縮小 50%) */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-bold">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> 定位座標 (3位小數)
            </span>
            <span className="bg-emerald-950 text-emerald-400 border border-emerald-700 px-1.5 py-0.2 rounded-full font-mono font-bold text-[10px]">
              ±{accuracy}m
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-center pt-0.5 font-mono">
            <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">緯度 (LAT)</span>
              <span className="text-xs font-black text-amber-300">{lat}</span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">經度 (LNG)</span>
              <span className="text-xs font-black text-amber-300">{lng}</span>
            </div>
          </div>
        </div>

        {/* 按鈕組 (縮小 50%) */}
        <div className="space-y-1.5 pt-0.5">
          <button
            onClick={handleNativeShare}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 border border-emerald-400 active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-white" />
            <span>📤 分享座標給 LINE / 震災親友</span>
          </button>

          <button
            onClick={handleCopyText}
            className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold py-1.5 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1.5 border border-cyan-600/80 active:scale-95 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">已複製座標訊息！</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>一鍵複製 GPS 連結訊息</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
