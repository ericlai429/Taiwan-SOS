import React from 'react';
import { Compass, Footprints, XCircle, ExternalLink, ShieldAlert } from 'lucide-react';
import { formatDistance, estimateWalkingTimeMinutes, getBearingDirection } from '../services/geo';

export default function NavigationCard({ target, userLocation, onStopNavigation }) {
  if (!target) return null;

  const distanceKm = userLocation
    ? formatDistance(
        Math.max(0.01, getDistance(userLocation.lat, userLocation.lng, target.lat, target.lng))
      )
    : '--';

  const numericDistKm = userLocation
    ? getDistance(userLocation.lat, userLocation.lng, target.lat, target.lng)
    : null;

  const minutes = numericDistKm ? estimateWalkingTimeMinutes(numericDistKm) : '--';
  const direction = (userLocation && target)
    ? getBearingDirection(userLocation.lat, userLocation.lng, target.lat, target.lng)
    : '前進方向';

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&travelmode=walking`;

  return (
    <div className="absolute top-4 left-3 right-3 z-[1000] max-w-xl mx-auto bg-slate-900/95 border-4 border-emerald-500 rounded-3xl p-4 shadow-2xl text-white backdrop-blur-md animate-bounce-short">
      <div className="flex items-start justify-between gap-2 border-b border-slate-700 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-emerald-600 rounded-2xl animate-pulse">
            <Footprints className="w-8 h-8 text-white" />
          </span>
          <div>
            <div className="text-senior-sm text-emerald-400 font-bold">導航前往目標中</div>
            <h3 className="text-senior-lg font-extrabold truncate max-w-[220px] sm:max-w-xs">{target.name}</h3>
          </div>
        </div>
        <button
          onClick={onStopNavigation}
          className="p-2 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-2xl flex items-center gap-1 active:scale-95 border border-rose-800"
          title="結束導航"
        >
          <XCircle className="w-7 h-7" />
          <span className="text-senior-sm font-bold">結束</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center bg-slate-800/80 rounded-2xl p-3 my-2 border border-slate-700">
        <div>
          <div className="text-slate-400 text-senior-sm">剩餘距離</div>
          <div className="text-senior-lg font-black text-amber-300">{distanceKm}</div>
        </div>
        <div>
          <div className="text-slate-400 text-senior-sm">預估時間</div>
          <div className="text-senior-lg font-black text-emerald-300">約 {minutes} 分鐘</div>
        </div>
        <div>
          <div className="text-slate-400 text-senior-sm">指引方向</div>
          <div className="text-senior-lg font-black text-cyan-300 flex items-center justify-center gap-1">
            <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
            {direction}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 text-senior-sm active:scale-95 border border-blue-400 shadow-md"
        >
          <ExternalLink className="w-5 h-5" />
          <span>開啟 Google 地圖備用導航</span>
        </a>
      </div>
    </div>
  );
}

// 輔助距離計算
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
