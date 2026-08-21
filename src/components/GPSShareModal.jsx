import React, { useState } from 'react';
import { Navigation, Share2, Copy, Check, Wifi, AlertTriangle, X, MapPin, ExternalLink } from 'lucide-react';

export default function GPSShareModal({ isOpen, onClose, userLocation }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const lat = userLocation?.lat ? userLocation.lat.toFixed(6) : '25.064500';
  const lng = userLocation?.lng ? userLocation.lng.toFixed(6) : '121.657000';
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
    <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800 border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 標題 */}
        <div className="flex items-center gap-2 text-emerald-400">
          <Navigation className="w-6 h-6 animate-pulse" />
          <h3 className="text-senior-lg font-black tracking-wide text-white">GPS 座標分享與定位警示</h3>
        </div>

        {/* 💡 溫馨提醒：開啟 Wi-Fi 可增加精準度 */}
        <div className="bg-amber-950/60 border border-amber-500/60 rounded-2xl p-3.5 flex items-start gap-2.5">
          <Wifi className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs sm:text-senior-sm text-amber-200 leading-relaxed font-bold">
            <span className="text-amber-400 font-extrabold block">💡 提升定位精準度溫馨提示：</span>
            請確定已開啟手機的 <strong className="text-white underline">Wi-Fi 與藍牙開關</strong>，可幫助手機透過周邊基地台與無線網路訊號，將定位精準度提升至巷弄與室內細部！
          </div>
        </div>

        {/* 當前座標顯示卡片 */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-bold">
              <MapPin className="w-4 h-4 text-rose-400" /> 當前動態 GPS 座標
            </span>
            <span className="bg-emerald-950 text-emerald-400 border border-emerald-700 px-2 py-0.5 rounded-full font-mono font-bold text-[11px]">
              高精準度 ±{accuracy} 米
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono">
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">緯度 (LAT)</span>
              <span className="text-senior-base font-black text-amber-300">{lat}</span>
            </div>
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">經度 (LNG)</span>
              <span className="text-senior-base font-black text-amber-300">{lng}</span>
            </div>
          </div>
        </div>

        {/* 按鈕組：Native 分享與一鍵複製 */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleNativeShare}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 px-4 rounded-2xl text-senior-base shadow-xl flex items-center justify-center gap-2 border border-emerald-400 active:scale-95 transition-all"
          >
            <Share2 className="w-5 h-5 text-white" />
            <span>📤 分享座標給 LINE / 震災親友</span>
          </button>

          <button
            onClick={handleCopyText}
            className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold py-2.5 px-4 rounded-2xl text-senior-sm flex items-center justify-center gap-2 border border-cyan-600/80 active:scale-95 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">已成功複製訊息至剪貼簿！</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>一鍵複製 GPS 連結訊息</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
