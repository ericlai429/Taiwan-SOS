import React from 'react';
import { ShieldAlert, AlertOctagon, Waves, ArrowRightCircle, X } from 'lucide-react';
import { getDistanceKm } from '../services/geo';

import missileZonesData from '../data/missile_zones.json';
import coastalZonesData from '../data/coastal_zones.json';

export default function ThreatAlertBanner({ userLocation, onNavigateToSafeShelter }) {
  if (!userLocation) return null;

  // 檢查是否在飛彈熱區半徑內
  const matchedMissile = missileZonesData.find(zone => {
    const distKm = getDistanceKm(userLocation.lat, userLocation.lng, zone.lat, zone.lng);
    return distKm <= (zone.radiusMeters / 1000);
  });

  // 檢查是否在沿海防衛圈半徑內
  const matchedCoastal = coastalZonesData.find(zone => {
    const distKm = getDistanceKm(userLocation.lat, userLocation.lng, zone.lat, zone.lng);
    return distKm <= (zone.radiusMeters / 1000);
  });

  if (!matchedMissile && !matchedCoastal) return null;

  const currentAlert = matchedMissile || matchedCoastal;
  const isMissile = !!matchedMissile;

  return (
    <div className="absolute top-16 left-3 right-3 z-[1000] max-w-xl mx-auto bg-slate-950/95 border-4 border-rose-600 rounded-3xl p-4 shadow-2xl text-white backdrop-blur-md animate-bounce-short">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-rose-600 rounded-2xl shrink-0 animate-pulse">
          {isMissile ? (
            <AlertOctagon className="w-8 h-8 text-white" />
          ) : (
            <Waves className="w-8 h-8 text-white" />
          )}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="inline-block px-2.5 py-0.5 bg-rose-900 border border-rose-500 rounded-full text-xs font-black text-rose-200">
              {isMissile ? '🚨 飛彈空襲高風險熱區警戒' : '🌊 沿海與灘岸入侵預警'}
            </span>
          </div>

          <h4 className="text-senior-base font-black text-rose-300">
            {currentAlert.title}
          </h4>

          <p className="text-senior-sm text-slate-200 leading-snug">
            {currentAlert.warningMsg}
          </p>

          <div className="pt-2 flex gap-2">
            <button
              onClick={onNavigateToSafeShelter}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black py-2.5 px-3 rounded-2xl text-senior-sm flex items-center justify-center gap-1.5 shadow-lg active:scale-95 border border-emerald-400"
            >
              <ArrowRightCircle className="w-5 h-5" />
              <span>尋找最近地下 B2/B3 避難所</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
