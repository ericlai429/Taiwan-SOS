import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, Filter, Flag, Calendar, ShieldAlert, Navigation, Lock, CircleDot, Zap, Ban, Flame } from 'lucide-react';
import { filterWithinRadius } from '../services/geo';
import { getStoredDangerFlags, getStoredCustomHazardZones } from '../services/storage';
import { decryptDangerFlag, decryptHazardZone } from '../services/crypto';
import NavigationCard from './NavigationCard';
import AddDangerFlagModal from './AddDangerFlagModal';
import AddHazardZoneModal from './AddHazardZoneModal';
import DailyIntelModal from './DailyIntelModal';
import HazardLegendCard from './HazardLegendCard';
import { useViewport } from '../services/useViewport';

import sheltersData from '../data/shelters.json';
import medicalData from '../data/medical.json';
import suppliesData from '../data/supplies.json';
import highRiskData from '../data/high_risk.json';
import hazardZonesData from '../data/hazard_zones.json';
import facilitiesData from '../data/facilities.json';
import missileZonesData from '../data/missile_zones.json';
import coastalZonesData from '../data/coastal_zones.json';

import ThreatAlertBanner from './ThreatAlertBanner';
import SOSFlashlightModal from './SOSFlashlightModal';
import SirenAudioModal from './SirenAudioModal';
import SurvivalChecklistModal from './SurvivalChecklistModal';
import InvasionPlaybackBar from './InvasionPlaybackBar';
import CountySelector from './CountySelector';
import DanmakuOverlay from './DanmakuOverlay';
import DanmakuInputBar from './DanmakuInputBar';
import Tooltip from './Tooltip';
import GPSShareModal from './GPSShareModal';
import { Share2 } from 'lucide-react';
import { networkSync } from '../services/networkSync';
import invasionHistoryData from '../data/invasion_history.json';
import osintVectorsData from '../data/osint_vectors.json';

export default function SafeMap({ cipherCode, onSelectDestination, btnLevel = 3 }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const layersRef = useRef({
    userMarker: null,
    radiusCircle: null,
    routeLine: null,
    sheltersGroup: null,
    medicalGroup: null,
    suppliesGroup: null,
    highRiskGroup: null,
    dangerFlagsGroup: null,
    hazardCirclesGroup: null,
    facilitiesGroup: null,
    missileGroup: null,
    coastalGroup: null,
    invasionGroup: null,
    osintGroup: null
  });

  const [userLocation, setUserLocation] = useState({ lat: 25.0645, lng: 121.6570 });
  const [gpsActive, setGpsActive] = useState(false);
  const [useRadiusFilter, setUseRadiusFilter] = useState(true);
  const [radiusKm, setRadiusKm] = useState(5);
  const [selectedCountyId, setSelectedCountyId] = useState('xz');

  const [navTarget, setNavTarget] = useState(null);

  // 切換全台 22 縣市跳轉
  const handleSelectCounty = (county) => {
    setSelectedCountyId(county.id);
    const newLoc = { lat: county.lat, lng: county.lng };
    setUserLocation(newLoc);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([county.lat, county.lng], 13, { animate: true });
    }
  };

  // 🌏 切換 5 大區域視野 (全區 ➔ 北區 ➔ 中區 ➔ 南區 ➔ 東區 輪播)
  const handleSelectRegion = (region) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([region.lat, region.lng], region.zoom, { animate: true });
    }
  };

  // 入侵時間軸步數狀態 (30分鐘為單位)
  const [currentInvasionStep, setCurrentInvasionStep] = useState(0);

  // 📢 彈幕廣播列表狀態 (包含前一小時 Log 載入與時間戳記)
  const getInitialDanmakuLogs = () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const stored = localStorage.getItem('taiwan_sos_danmaku_logs');

    let logs = [];
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // 過濾只保留前一個小時內的彈幕紀錄
        logs = parsed.filter(item => item.timestamp >= oneHourAgo);
      } catch (e) {
        console.error('Failed to parse stored danmaku logs', e);
      }
    }

    if (!logs || logs.length === 0) {
      const formatTime = (ts) => {
        const d = new Date(ts);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `(${hh}時${mm}分)`;
      };

      logs = [
        { id: 'dm-1', text: `📍 新北汐止大同路：站前廣場自來水水車加水站作業中 ${formatTime(now - 12 * 60 * 1000)}`, sender: '汐止民防組', topPercent: 16, speedSeconds: 15, timestamp: now - 12 * 60 * 1000 },
        { id: 'dm-2', text: `📍 台北車站地下 B3 層：防空避難所空間充足通風中 ${formatTime(now - 28 * 60 * 1000)}`, sender: '雙北應變中心', topPercent: 26, speedSeconds: 17, timestamp: now - 28 * 60 * 1000 },
        { id: 'dm-3', text: `📍 台中清泉崗：周邊社區加水站水車兩小時補水一次 ${formatTime(now - 42 * 60 * 1000)}`, sender: '中部後勤組', topPercent: 36, speedSeconds: 16, timestamp: now - 42 * 60 * 1000 },
        { id: 'dm-4', text: `📍 高雄美麗島站：地下街備有外科創傷敷料與急救水包 ${formatTime(now - 52 * 60 * 1000)}`, sender: '南部醫療組', topPercent: 44, speedSeconds: 18, timestamp: now - 52 * 60 * 1000 }
      ];
      localStorage.setItem('taiwan_sos_danmaku_logs', JSON.stringify(logs));
    }
    return logs;
  };

  const [danmakuList, setDanmakuList] = useState(getInitialDanmakuLogs);

  // 跨分頁 / 跨實體裝置 (手機 <-> 電腦/NB 4G/Wi-Fi) 即時連線對齊
  useEffect(() => {
    networkSync.setChannel(cipherCode);

    const unsubscribe = networkSync.subscribe((payload) => {
      if (payload && payload.type === 'DANMAKU' && payload.data) {
        setDanmakuList(prev => {
          if (prev.some(item => item.id === payload.data.id)) return prev;
          const updated = [...prev, payload.data];
          const oneHourAgo = Date.now() - 60 * 60 * 1000;
          return updated.filter(item => item.timestamp >= oneHourAgo);
        });
      }
    });

    return () => unsubscribe();
  }, [cipherCode]);

  const handleSendDanmaku = (text) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeTag = `(${hh}時${mm}分)`;

    const textWithTime = text.includes('分)') ? text : `${text} ${timeTag}`;

    const newDanmaku = {
      id: `dm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: textWithTime,
      sender: cipherCode ? '暗碼連線' : '全台廣播',
      topPercent: Math.floor(Math.random() * 35) + 15,
      speedSeconds: 14,
      timestamp: Date.now()
    };

    setDanmakuList(prev => {
      const updated = [...prev, newDanmaku];
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const validLogs = updated.filter(item => item.timestamp >= oneHourAgo);
      localStorage.setItem('taiwan_sos_danmaku_logs', JSON.stringify(validLogs));
      return updated;
    });

    // 🌐 跨裝置 (手機 <-> 電腦/NB) 即時網路廣播對齊
    networkSync.broadcast('DANMAKU', newDanmaku);
  };

  // 圖層開關狀態
  const [showShelters, setShowShelters] = useState(true);
  const [showMedical, setShowMedical] = useState(true);
  const [showSupplies, setShowSupplies] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showHighRisk, setShowHighRisk] = useState(true);
  const [showDangerFlags, setShowDangerFlags] = useState(true);

  // 災害、飛彈/沿海預警與敵入侵開關
  const [showUtility, setShowUtility] = useState(true);
  const [showBlockade, setShowBlockade] = useState(true);
  const [showCasualty, setShowCasualty] = useState(true);
  const [showMissile, setShowMissile] = useState(true);
  const [showCoastal, setShowCoastal] = useState(true);
  const [showInvasion, setShowInvasion] = useState(true);

  // 解密點位與圈圈
  const [decryptedFlags, setDecryptedFlags] = useState([]);
  const [decryptedCustomHazards, setDecryptedCustomHazards] = useState([]);

  // Modal 狀態
  const [isAddFlagOpen, setIsAddFlagOpen] = useState(false);
  const [isAddHazardOpen, setIsAddHazardOpen] = useState(false);
  const [isDailyIntelOpen, setIsDailyIntelOpen] = useState(false);
  const [isFlashlightOpen, setIsFlashlightOpen] = useState(false);
  const [isSirenOpen, setIsSirenOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isGPSShareOpen, setIsGPSShareOpen] = useState(false);

  // 1. 初始化 Leaflet 地圖
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [25.0645, 121.6570],
      zoom: 14,
      zoomControl: false,
      preferCanvas: true, // 📌 啟用 HTML5 Canvas 向量硬體加速渲染 (徹底消除雙指縮放卡頓)
      fadeAnimation: false, // 停用淡出淡入動畫，防止地點文字與圖標在移動或縮放地圖時短暫消失
      zoomAnimation: true, // 啟用平滑手勢縮放
      markerZoomAnimation: true,
      bounceAtZoomLimits: false,
      wheelDebounceTime: 40
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors | 雙北桃園安全避難網'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    layersRef.current.sheltersGroup = L.layerGroup().addTo(map);
    layersRef.current.medicalGroup = L.layerGroup().addTo(map);
    layersRef.current.suppliesGroup = L.layerGroup().addTo(map);
    layersRef.current.highRiskGroup = L.layerGroup().addTo(map);
    layersRef.current.dangerFlagsGroup = L.layerGroup().addTo(map);
    layersRef.current.hazardCirclesGroup = L.layerGroup().addTo(map);
    layersRef.current.facilitiesGroup = L.layerGroup().addTo(map);
    layersRef.current.missileGroup = L.layerGroup().addTo(map);
    layersRef.current.coastalGroup = L.layerGroup().addTo(map);
    layersRef.current.invasionGroup = L.layerGroup().addTo(map);
    layersRef.current.osintGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. 移動中的 GPS 高精度真實定位與動態追蹤
  useEffect(() => {
    if (!navigator.geolocation) return;

    // A. 載入時立刻進行一次硬體高精度 GPS 座標定位並自動跳轉地圖至真實位置
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const realLoc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed
        };
        setUserLocation(realLoc);
        setGpsActive(true);
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([realLoc.lat, realLoc.lng], 15, { animate: true });
        }
      },
      (err) => console.warn('首刷 GPS 定位失敗/遭封鎖，使用預設中心:', err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // B. 開啟實時動態 GPS 追蹤 (watchPosition)
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed
        });
        setGpsActive(true);
      },
      (err) => console.warn('GPS watch error:', err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 3. 解密親友動態點位與自訂災害範圍圈
  const loadAndDecryptData = async () => {
    // A. 旗標
    const rawFlags = getStoredDangerFlags();
    const resFlags = [];
    for (const raw of rawFlags) {
      if (raw.isEncrypted) {
        const dec = await decryptDangerFlag(raw, cipherCode);
        if (dec) resFlags.push({ ...dec, isUnlocked: true });
        else resFlags.push({ id: raw.id, title: '🔒 暗碼保護旗標', level: 'locked', lat: 25.0478, lng: 121.5170, isUnlocked: false });
      }
    }
    setDecryptedFlags(resFlags);

    // B. 彩色災害圈
    const rawCustomHazards = getStoredCustomHazardZones();
    const resHazards = [];
    for (const raw of rawCustomHazards) {
      if (raw.isEncrypted) {
        const dec = await decryptHazardZone(raw, cipherCode);
        if (dec) resHazards.push({ ...dec, isUnlocked: true });
        else resHazards.push({ id: raw.id, title: '🔒 暗碼加密災害圈', lat: 25.0478, lng: 121.5170, radiusMeters: 500, color: '#64748b', isUnlocked: false });
      }
    }
    setDecryptedCustomHazards(resHazards);
  };

  useEffect(() => {
    loadAndDecryptData();
  }, [cipherCode]);

  // 4. 定位標籤與 5km 範圍圈 (平滑 setLatLng，防止縮放地圖時 Popup 閃爍或短暫消失)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    const latlng = [userLocation.lat, userLocation.lng];

    if (!layersRef.current.userMarker) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-40 animate-ping"></div>
            <div class="w-6 h-6 bg-blue-600 border-4 border-white rounded-full shadow-lg"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      layersRef.current.userMarker = L.marker(latlng, { icon: userIcon })
        .addTo(map)
        .bindPopup('<div class="font-bold text-base">📍 您目前的動態位置</div>', { autoPan: false, keepInView: true });
    } else {
      layersRef.current.userMarker.setLatLng(latlng);
    }

    if (useRadiusFilter) {
      if (!layersRef.current.radiusCircle) {
        layersRef.current.radiusCircle = L.circle(latlng, {
          radius: radiusKm * 1000,
          color: '#15803d',
          fillColor: '#22c55e',
          fillOpacity: 0.12,
          weight: 3,
          dashArray: '8, 8'
        }).addTo(map);
      } else {
        layersRef.current.radiusCircle.setLatLng(latlng);
        layersRef.current.radiusCircle.setRadius(radiusKm * 1000);
      }
    } else if (layersRef.current.radiusCircle) {
      map.removeLayer(layersRef.current.radiusCircle);
      layersRef.current.radiusCircle = null;
    }
  }, [userLocation, useRadiusFilter, radiusKm]);

  // 5. 綜合彩色災害範圍圈 (Multi-Color Hazard Circle Overlays) 渲染
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    layersRef.current.hazardCirclesGroup.clearLayers();

    const allHazards = [...hazardZonesData, ...decryptedCustomHazards.filter(h => h.isUnlocked)];

    allHazards.forEach(h => {
      let isVisible = false;
      if (h.type === 'utility_outage' && showUtility) isVisible = true;
      if (h.type === 'road_blockade' && showBlockade) isVisible = true;
      if (h.type === 'casualty_destruction' && showCasualty) isVisible = true;

      if (isVisible) {
        const circle = L.circle([h.lat, h.lng], {
          radius: h.radiusMeters || 500,
          color: h.color || '#c2b280',
          fillColor: h.fillColor || h.color || '#c2b280',
          fillOpacity: h.fillOpacity || 0.3,
          weight: h.type === 'road_blockade' ? 4 : 3,
          dashArray: h.type === 'road_blockade' ? '8, 8' : null
        });

        const iconSymbol =
          h.type === 'utility_outage' ? '💧' :
          h.type === 'road_blockade' ? '🚧' : '💥';

        circle.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <h4 style="font-size: 16px; font-weight: bold; color: ${h.color}; margin:0 0 4px 0;">${iconSymbol} ${h.title}</h4>
            <p style="margin:2px 0;"><b>類別：</b>${h.typeName || h.type}</p>
            <p style="margin:2px 0;"><b>影響半徑：</b>${h.radiusMeters} 公尺</p>
            <p style="margin:2px 0; color:#cbd5e1;">${h.description || '強烈建議通行避開此區域'}</p>
          </div>
        `);

        layersRef.current.hazardCirclesGroup.addLayer(circle);
      }
    });

    // 飛彈熱區渲染
    layersRef.current.missileGroup.clearLayers();
    if (showMissile) {
      missileZonesData.forEach(m => {
        const circle = L.circle([m.lat, m.lng], {
          radius: m.radiusMeters,
          color: m.color,
          fillColor: m.fillColor,
          fillOpacity: m.fillOpacity,
          weight: 4,
          dashArray: '4, 4'
        }).bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <h4 style="font-size: 16px; font-weight: bold; color: #ef4444; margin:0 0 4px 0;">${m.title}</h4>
            <p style="margin:2px 0;"><b>影響半徑：</b>${m.radiusMeters} 公尺</p>
            <p style="margin:2px 0; color:#fca5a5;">${m.warningMsg}</p>
          </div>
        `);
        layersRef.current.missileGroup.addLayer(circle);
      });
    }

    // 沿海與 15 大紅色海灘預警渲染
    layersRef.current.coastalGroup.clearLayers();
    if (showCoastal) {
      coastalZonesData.forEach(c => {
        const circle = L.circle([c.lat, c.lng], {
          radius: c.radiusMeters,
          color: c.color,
          fillColor: c.fillColor,
          fillOpacity: c.fillOpacity,
          weight: 3,
          dashArray: '10, 6'
        }).bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <h4 style="font-size: 16px; font-weight: bold; color: #ea580c; margin:0 0 4px 0;">${c.title}</h4>
            <p style="margin:2px 0;"><b>警戒半徑：</b>${c.radiusMeters} 公尺</p>
            <p style="margin:2px 0; color:#fdba74;">${c.warningMsg}</p>
          </div>
        `, { autoPan: false, keepInView: true });
        layersRef.current.coastalGroup.addLayer(circle);
      });
    }

    // ⚓✈️ 開源動態向量情報 (OSINT Naval Ships & Military Aircraft) 渲染
    layersRef.current.osintGroup.clearLayers();
    if (showCoastal || showInvasion) {
      // 1. 海上艦艇與登陸船團向量
      osintVectorsData.navalVessels.forEach(ship => {
        const shipIcon = L.divIcon({
          className: 'osint-ship-icon',
          html: `<div class="bg-blue-950 border-2 border-cyan-400 text-cyan-300 font-extrabold px-2 py-0.5 rounded-xl text-xs flex items-center gap-1 shadow-2xl animate-pulse">${ship.name}</div>`,
          iconSize: [145, 26],
          iconAnchor: [72, 13]
        });

        const marker = L.marker([ship.lat, ship.lng], { icon: shipIcon }).bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <h4 style="font-size: 15px; font-weight: bold; color: #38bdf8; margin:0 0 4px 0;">${ship.name}</h4>
            <p style="margin:2px 0;"><b>航向/航速：</b>${ship.heading}° / ${ship.speedKnots} 節</p>
            <p style="margin:2px 0; color:#38bdf8;"><b>開源情報狀態：</b>${ship.status}</p>
          </div>
        `, { autoPan: false, keepInView: true });

        layersRef.current.osintGroup.addLayer(marker);

        if (ship.vector && ship.vector.length > 1) {
          const polyline = L.polyline(ship.vector, {
            color: '#0284c7',
            weight: 3,
            dashArray: '6, 6',
            opacity: 0.85
          });
          layersRef.current.osintGroup.addLayer(polyline);
        }
      });

      // 2. 空中戰機、預警機與無人機戰術航跡
      osintVectorsData.aircraftVectors.forEach(air => {
        const airIcon = L.divIcon({
          className: 'osint-air-icon',
          html: `<div class="bg-indigo-950 border-2 border-indigo-400 text-indigo-200 font-extrabold px-2 py-0.5 rounded-xl text-xs flex items-center gap-1 shadow-2xl animate-bounce-short">${air.name}</div>`,
          iconSize: [145, 26],
          iconAnchor: [72, 13]
        });

        const marker = L.marker([air.lat, air.lng], { icon: airIcon }).bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <h4 style="font-size: 15px; font-weight: bold; color: #a5b4fc; margin:0 0 4px 0;">${air.name}</h4>
            <p style="margin:2px 0;"><b>高度/航向：</b>${air.altitudeFt} ft / ${air.heading}°</p>
            <p style="margin:2px 0; color:#a5b4fc;"><b>開源情報航跡：</b>${air.status}</p>
          </div>
        `, { autoPan: false, keepInView: true });

        layersRef.current.osintGroup.addLayer(marker);

        if (air.path && air.path.length > 1) {
          const polyline = L.polyline(air.path, {
            color: '#6366f1',
            weight: 3,
            dashArray: '4, 4',
            opacity: 0.9
          });
          layersRef.current.osintGroup.addLayer(polyline);
        }
      });
    }

    // 😈 敵入侵/佔領區 (暗紫色中毒泡泡異型多邊形與淡水河/基隆河快艇演變)
    layersRef.current.invasionGroup.clearLayers();
    if (showInvasion) {
      const activeSnapshot = invasionHistoryData[currentInvasionStep] || invasionHistoryData[0];

      // A. 異型暗紫色中毒泡泡多邊形
      if (activeSnapshot.polygons) {
        activeSnapshot.polygons.forEach(poly => {
          const polygon = L.polygon(poly.coords, {
            className: 'poison-occupied-polygon'
          }).bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
              <h4 style="font-size: 16px; font-weight: bold; color: #a855f7; margin:0 0 4px 0;">😈 ${poly.name} (敵佔領/滲透區)</h4>
              <p style="margin:2px 0;"><b>時間點：</b><span style="color:#f59e0b; font-weight:bold;">${activeSnapshot.timeLabel}</span></p>
              <p style="margin:2px 0; color:#e9d5ff;">${activeSnapshot.description}</p>
              <p style="margin:4px 0 0 0; color:#ef4444; font-weight:bold;">⚠️ 告誡：請嚴禁接近此區域，速避入地下強固設施！</p>
            </div>
          `);
          layersRef.current.invasionGroup.addLayer(polygon);
        });
      }

      // B. 淡水河 / 基隆河突襲快艇位置點
      if (activeSnapshot.speedboats) {
        activeSnapshot.speedboats.forEach(boat => {
          const boatIcon = L.divIcon({
            className: 'boat-icon',
            html: `<div class="bg-purple-900 border-2 border-purple-400 text-white font-extrabold px-2 py-1 rounded-xl text-xs flex items-center gap-1 shadow-lg animate-bounce">${boat.name}</div>`,
            iconSize: [120, 30],
            iconAnchor: [60, 15]
          });

          const boatMarker = L.marker([boat.lat, boat.lng], { icon: boatIcon }).bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
              <h4 style="font-size: 15px; font-weight: bold; color: #c084fc; margin:0 0 4px 0;">${boat.name}</h4>
              <p style="margin:2px 0;"><b>進攻向量：</b>${boat.vector}</p>
              <p style="margin:2px 0; color:#cbd5e1;">時間軸狀態：${activeSnapshot.timeKey}</p>
            </div>
          `, { autoPan: false, keepInView: true });
          layersRef.current.invasionGroup.addLayer(boatMarker);
        });
      }

      // C. 🚀 彈道飛彈打擊軌跡與著彈區預警 (東風系列彈道飛彈與爆震半徑)
      if (activeSnapshot.missiles) {
        activeSnapshot.missiles.forEach(msl => {
          if (msl.trajectory && msl.trajectory.length > 1) {
            const pathLine = L.polyline(msl.trajectory, {
              color: '#ef4444',
              weight: 3,
              dashArray: '5, 5',
              opacity: 0.9
            });
            layersRef.current.invasionGroup.addLayer(pathLine);
          }

          const blastCircle = L.circle([msl.impactLat, msl.impactLng], {
            radius: msl.blastRadiusMeters,
            color: '#dc2626',
            fillColor: '#b91c1c',
            fillOpacity: 0.45,
            weight: 3,
            dashArray: '4, 4'
          }).bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
              <h4 style="font-size: 16px; font-weight: bold; color: #ef4444; margin:0 0 4px 0;">🚀 ${msl.name}</h4>
              <p style="margin:2px 0;"><b>目標地點：</b><span style="color:#fca5a5; font-weight:bold;">${msl.targetName}</span></p>
              <p style="margin:2px 0;"><b>預估爆震半徑：</b>${msl.blastRadiusMeters} 公尺</p>
              <p style="margin:4px 0 0 0; color:#f59e0b; font-weight:bold;">⚠️ 告誡：彈道預警降落，請迅速趴下護頭躲避！</p>
            </div>
          `, { autoPan: false, keepInView: true });

          layersRef.current.invasionGroup.addLayer(blastCircle);

          const mslIcon = L.divIcon({
            className: 'missile-impact-icon',
            html: `<div class="bg-rose-950 border-2 border-rose-500 text-rose-300 font-extrabold px-2 py-0.5 rounded-xl text-xs flex items-center gap-1 shadow-2xl animate-pulse">🚀 ${msl.name}</div>`,
            iconSize: [160, 28],
            iconAnchor: [80, 14]
          });

          const mslMarker = L.marker([msl.impactLat, msl.impactLng], { icon: mslIcon }).bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
              <h4 style="font-size: 15px; font-weight: bold; color: #ef4444; margin:0 0 4px 0;">🚀 ${msl.name} (著彈區)</h4>
              <p style="margin:2px 0;"><b>預計打擊：</b>${msl.targetName}</p>
            </div>
          `, { autoPan: false, keepInView: true });

          layersRef.current.invasionGroup.addLayer(mslMarker);
        });
      }

      // D. 🪂 敵軍飛機傘兵機降與空降集結推演
      if (activeSnapshot.paratrooperDrops) {
        activeSnapshot.paratrooperDrops.forEach(drop => {
          const dropCircle = L.circle([drop.lat, drop.lng], {
            radius: drop.radiusMeters,
            color: '#a855f7',
            fillColor: '#9333ea',
            fillOpacity: 0.35,
            weight: 3,
            dashArray: '8, 4'
          }).bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
              <h4 style="font-size: 16px; font-weight: bold; color: #c084fc; margin:0 0 4px 0;">🪂 ${drop.name}</h4>
              <p style="margin:2px 0;"><b>空降地點：</b>${drop.locationName}</p>
              <p style="margin:2px 0;"><b>載運機型：</b>${drop.aircraft}</p>
              <p style="margin:2px 0; color:#e9d5ff;">${drop.notes}</p>
            </div>
          `, { autoPan: false, keepInView: true });

          layersRef.current.invasionGroup.addLayer(dropCircle);

          const dropIcon = L.divIcon({
            className: 'drop-icon',
            html: `<div class="bg-purple-950 border-2 border-purple-400 text-purple-200 font-extrabold px-2 py-0.5 rounded-xl text-xs flex items-center gap-1 shadow-2xl animate-bounce-short">${drop.name}</div>`,
            iconSize: [160, 28],
            iconAnchor: [80, 14]
          });

          const dropMarker = L.marker([drop.lat, drop.lng], { icon: dropIcon }).bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
              <h4 style="font-size: 15px; font-weight: bold; color: #c084fc; margin:0 0 4px 0;">🪂 ${drop.name}</h4>
              <p style="margin:2px 0;"><b>機型：</b>${drop.aircraft}</p>
              <p style="margin:2px 0; color:#e9d5ff;">${drop.notes}</p>
            </div>
          `, { autoPan: false, keepInView: true });

          layersRef.current.invasionGroup.addLayer(dropMarker);
        });
      }
    }
  }, [showUtility, showBlockade, showCasualty, showMissile, showCoastal, showInvasion, currentInvasionStep, decryptedCustomHazards]);

  // 📌 1. 動態計算 5 級距點位標籤 (地點名稱文字為質感淺灰色 text-slate-200，尺寸再縮小 20%)
  const createSmartMarkerIcon = (iconSymbol, name, category, level) => {
    const borderColor =
      category === 'shelter' ? 'border-emerald-500' :
      category === 'medical' ? 'border-rose-500' :
      category === 'supplies' ? 'border-amber-500' :
      category === 'police' ? 'border-blue-500' :
      category === 'fire' ? 'border-orange-500' :
      category === 'community' ? 'border-purple-500' : 'border-teal-500';

    const dotBg =
      category === 'shelter' ? 'bg-emerald-600' :
      category === 'medical' ? 'bg-rose-600' :
      category === 'supplies' ? 'bg-amber-600' :
      category === 'police' ? 'bg-blue-600' :
      category === 'fire' ? 'bg-orange-600' :
      category === 'community' ? 'bg-purple-600' : 'bg-teal-600';

    if (level === 1) {
      // 微型 25px: 極簡圓形圖示 (0% 遮擋，縮小 20%)
      return L.divIcon({
        className: 'smart-dot-icon',
        html: `<div class="${dotBg} text-white font-black w-6 h-6 rounded-full border border-white flex items-center justify-center text-[10px] shadow-xl transition-all active:scale-125 hover:scale-110">${iconSymbol}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
    } else if (level === 2) {
      // 精簡 33px: 深色玻璃膠囊 + 淺灰色地點文字說明 (縮小 20%)
      const shortName = name.length > 5 ? name.substring(0, 4) + '..' : name;
      return L.divIcon({
        className: 'smart-mini-icon',
        html: `<div class="bg-slate-900/95 text-slate-200 font-bold px-1.5 py-0.5 rounded-full border ${borderColor} text-[9px] shadow-lg flex items-center gap-1 whitespace-nowrap">${iconSymbol} ${shortName}</div>`,
        iconSize: [60, 20],
        iconAnchor: [30, 10]
      });
    } else if (level === 3) {
      // 標準 42px: 深色玻璃膠囊 + 淺灰色地點文字說明 (縮小 20%)
      const shortName = name.length > 8 ? name.substring(0, 7) + '..' : name;
      return L.divIcon({
        className: 'smart-std-icon',
        html: `<div class="bg-slate-900/95 text-slate-200 font-bold px-2 py-0.5 rounded-lg border-2 ${borderColor} text-[10px] shadow-lg flex items-center gap-1 whitespace-nowrap">${iconSymbol} ${shortName}</div>`,
        iconSize: [90, 24],
        iconAnchor: [45, 12]
      });
    } else {
      // 長輩 / 特大 50px~60px: 深色玻璃膠囊 + 完整淺灰色地點文字說明 (縮小 20%)
      return L.divIcon({
        className: 'smart-full-icon',
        html: `<div class="bg-slate-900/95 text-slate-200 font-extrabold px-2.5 py-1 rounded-xl border-2 ${borderColor} text-xs shadow-xl flex items-center gap-1 whitespace-nowrap">${iconSymbol} ${name}</div>`,
        iconSize: [120, 28],
        iconAnchor: [60, 14]
      });
    }
  };

  // 📌 2. 蛛網狀防碰撞散開演算法 (Radial Collision Offset Algorithm)
  const getOffsetLatLng = (itemList, currentIndex) => {
    const target = itemList[currentIndex];
    let sameGroup = [];
    for (let i = 0; i < itemList.length; i++) {
      const dLat = Math.abs(itemList[i].lat - target.lat);
      const dLng = Math.abs(itemList[i].lng - target.lng);
      if (dLat < 0.0035 && dLng < 0.0035) {
        sameGroup.push(i);
      }
    }

    if (sameGroup.length <= 1) {
      return [target.lat, target.lng];
    }

    const posInGroup = sameGroup.indexOf(currentIndex);
    const angle = (posInGroup / sameGroup.length) * 2 * Math.PI;
    const offsetDistance = 0.0016; // 散開距離約 160 米，防完全重疊

    return [
      target.lat + offsetDistance * Math.sin(angle),
      target.lng + offsetDistance * Math.cos(angle)
    ];
  };

  // 6. 避難所、醫療、物資、派出所/消防/診所與親友旗標點位渲染
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    const filteredShelters = useRadiusFilter ? filterWithinRadius(sheltersData, userLocation.lat, userLocation.lng, radiusKm) : sheltersData;
    const filteredMedical = useRadiusFilter ? filterWithinRadius(medicalData, userLocation.lat, userLocation.lng, radiusKm) : medicalData;
    const filteredSupplies = useRadiusFilter ? filterWithinRadius(suppliesData, userLocation.lat, userLocation.lng, radiusKm) : suppliesData;
    const filteredHighRisk = useRadiusFilter ? filterWithinRadius(highRiskData, userLocation.lat, userLocation.lng, radiusKm) : highRiskData;
    const filteredFacilities = useRadiusFilter ? filterWithinRadius(facilitiesData, userLocation.lat, userLocation.lng, radiusKm) : facilitiesData;

    // E. 派出所、消防隊、活動中心、外科診所 (防碰撞散開 + 5 級距圖標)
    layersRef.current.facilitiesGroup.clearLayers();
    if (showFacilities) {
      filteredFacilities.forEach((item, idx) => {
        const iconSymbol =
          item.type === 'police' ? '👮' :
          item.type === 'fire' ? '🚒' :
          item.type === 'community' ? '🏛️' : '🩺';

        const icon = createSmartMarkerIcon(iconSymbol, item.name, item.type || 'police', btnLevel);
        const pos = getOffsetLatLng(filteredFacilities, idx);

        const marker = L.marker(pos, { icon })
          .bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
              <h4 style="font-size: 15px; font-weight: bold; color: #38bdf8; margin:0 0 4px 0;">${iconSymbol} ${item.name}</h4>
              <p style="margin:2px 0;"><b>類別：</b>${item.typeName}</p>
              <p style="margin:2px 0;"><b>地址：</b>${item.address}</p>
              ${item.phone ? `<p style="margin:2px 0;"><b>直撥電話：</b><a href="tel:${item.phone}" style="color:#f59e0b; font-weight:bold;">${item.phone}</a></p>` : ''}
              <p style="margin:2px 0; color:#94a3b8;">${item.notes || ''}</p>
              <button id="nav-btn-${item.id}" style="margin-top:8px; width:100%; background:#0284c7; color:#fff; font-weight:bold; border:none; padding:8px; border-radius:8px; cursor:pointer;">🚀 開始導航前往</button>
            </div>
          `, { autoPan: false, keepInView: true });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`nav-btn-${item.id}`);
          if (btn) btn.onclick = () => startNavigation(item);
        });

        layersRef.current.facilitiesGroup.addLayer(marker);
      });
    }

    // A. 避難所 (防碰撞散開 + 5 級距圖標)
    layersRef.current.sheltersGroup.clearLayers();
    if (showShelters) {
      filteredShelters.forEach((item, idx) => {
        const icon = createSmartMarkerIcon('🛡️', item.name, 'shelter', btnLevel);
        const pos = getOffsetLatLng(filteredShelters, idx);

        const marker = L.marker(pos, { icon })
          .bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
              <h4 style="font-size: 16px; font-weight: bold; color: #15803d; margin:0 0 4px 0;">🛡️ ${item.name}</h4>
              <p style="margin: 2px 0;"><b>地址：</b>${item.address}</p>
              <p style="margin: 2px 0;"><b>容納人數：</b>${item.capacity} 人</p>
              <button id="nav-btn-${item.id}" style="margin-top:8px; width:100%; background:#16a34a; color:#fff; font-weight:bold; border:none; padding:8px; border-radius:8px; cursor:pointer;">🚀 開始導航前往此避難所</button>
            </div>
          `, { autoPan: false, keepInView: true });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`nav-btn-${item.id}`);
          if (btn) btn.onclick = () => startNavigation(item);
        });
        layersRef.current.sheltersGroup.addLayer(marker);
      });
    }

    // B. 醫療 (防碰撞散開 + 5 級距圖標)
    layersRef.current.medicalGroup.clearLayers();
    if (showMedical) {
      filteredMedical.forEach((item, idx) => {
        const icon = createSmartMarkerIcon('🏥', item.name, 'medical', btnLevel);
        const pos = getOffsetLatLng(filteredMedical, idx);

        const marker = L.marker(pos, { icon })
          .bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
              <h4 style="font-size: 16px; font-weight: bold; color: #b91c1c; margin:0 0 4px 0;">🏥 ${item.name}</h4>
              <p style="margin: 2px 0;"><b>地址：</b>${item.address}</p>
              <p style="margin: 2px 0;"><b>電話：</b><a href="tel:${item.phone}">${item.phone}</a></p>
              <button id="nav-btn-${item.id}" style="margin-top:8px; width:100%; background:#dc2626; color:#fff; font-weight:bold; border:none; padding:8px; border-radius:8px; cursor:pointer;">🚀 開始導航前往急救醫療</button>
            </div>
          `, { autoPan: false, keepInView: true });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`nav-btn-${item.id}`);
          if (btn) btn.onclick = () => startNavigation(item);
        });
        layersRef.current.medicalGroup.addLayer(marker);
      });
    }

    // C. 物資 (防碰撞散開 + 5 級距圖標)
    layersRef.current.suppliesGroup.clearLayers();
    if (showSupplies) {
      filteredSupplies.forEach((item, idx) => {
        const icon = createSmartMarkerIcon('📦', item.name, 'supplies', btnLevel);
        const pos = getOffsetLatLng(filteredSupplies, idx);

        const marker = L.marker(pos, { icon })
          .bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
              <h4 style="font-size: 16px; font-weight: bold; color: #d97706; margin:0 0 4px 0;">📦 ${item.name}</h4>
              <p style="margin: 2px 0;"><b>發放物資：</b>${item.items ? item.items.join('、') : '水與口糧'}</p>
              <button id="nav-btn-${item.id}" style="margin-top:8px; width:100%; background:#d97706; color:#fff; font-weight:bold; border:none; padding:8px; border-radius:8px; cursor:pointer;">🚀 開始導航前往領取物資</button>
            </div>
          `, { autoPan: false, keepInView: true });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`nav-btn-${item.id}`);
          if (btn) btn.onclick = () => startNavigation(item);
        });
        layersRef.current.suppliesGroup.addLayer(marker);
      });
    }

    // D. 旗標
    layersRef.current.dangerFlagsGroup.clearLayers();
    if (showDangerFlags) {
      decryptedFlags.forEach(flag => {
        const isUnlocked = flag.isUnlocked;
        const icon = L.divIcon({
          className: 'flag-icon',
          html: isUnlocked
            ? `<div class="bg-rose-600 text-white font-black px-2 py-1 rounded-xl shadow-lg border-2 border-amber-300 text-xs animate-bounce">🚩 ${flag.title}</div>`
            : `<div class="bg-slate-700 text-amber-400 font-bold px-2 py-1 rounded-xl shadow-lg border-2 border-slate-500 text-xs">🔒 暗碼旗標</div>`,
          iconSize: [130, 32],
          iconAnchor: [65, 16]
        });
        const marker = L.marker([flag.lat, flag.lng], { icon }).bindPopup(
          isUnlocked
            ? `<div style="padding:4px;"><h4 style="font-weight:bold; color:#dc2626;">🚩 ${flag.title}</h4><p>${flag.description || ''}</p></div>`
            : `<div style="padding:4px;"><h4 style="color:#d97706;">🔒 暗碼保護情報</h4></div>`,
          { autoPan: false, keepInView: true }
        );
        layersRef.current.dangerFlagsGroup.addLayer(marker);
      });
    }

    // F. ⚡💧 關鍵電廠與淨水場危險熱區 (High Risk Power & Water Facilities)
    layersRef.current.highRiskGroup.clearLayers();
    filteredHighRisk.forEach((item, idx) => {
      const isPower = item.category === 'power';
      const isWater = item.category === 'water';
      const iconSymbol = isPower ? '⚡' : isWater ? '💧' : '🏛️';
      const badgeBg = isPower
        ? 'bg-amber-950/95 text-amber-300 border-amber-500'
        : isWater
        ? 'bg-cyan-950/95 text-cyan-300 border-cyan-500'
        : 'bg-rose-950/95 text-rose-300 border-rose-500';

      const icon = L.divIcon({
        className: 'high-risk-icon',
        html: `<div class="${badgeBg} font-black px-2 py-0.5 rounded-full border-2 text-[10px] shadow-xl flex items-center gap-1 whitespace-nowrap animate-pulse">${iconSymbol} ${item.name}</div>`,
        iconSize: [130, 24],
        iconAnchor: [65, 12]
      });

      const pos = getOffsetLatLng(filteredHighRisk, idx);
      const marker = L.marker(pos, { icon }).bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <h4 style="font-size: 15px; font-weight: bold; color: ${isPower ? '#f59e0b' : '#38bdf8'}; margin:0 0 4px 0;">${iconSymbol} ${item.name}</h4>
          <p style="margin:2px 0;"><b>警示等級：</b><span style="color:#ef4444; font-weight:bold;">${item.risk_level}</span></p>
          <p style="margin:2px 0;"><b>位址地區：</b>${item.city}${item.district}</p>
          <p style="margin:4px 0; color:#cbd5e1; font-size:12px; line-height:1.4;">${item.reason}</p>
          <div style="margin-top:6px; padding:4px 8px; background:#451a03; border:1px solid #d97706; border-radius:6px; color:#fde68a; font-size:11px; font-weight:bold;">
            ⚠️ 建議一般避難民眾保持 ${item.radiusMeters || 800}m 以上安全避難距離
          </div>
        </div>
      `, { autoPan: false, keepInView: true });

      layersRef.current.highRiskGroup.addLayer(marker);

      // 繪製紅/黃色危險熱區圈 (Danger Zone Circle)
      const circle = L.circle(pos, {
        radius: item.radiusMeters || 800,
        color: isPower ? '#f59e0b' : isWater ? '#0284c7' : '#dc2626',
        fillColor: isPower ? '#d97706' : isWater ? '#38bdf8' : '#ef4444',
        fillOpacity: 0.22,
        weight: 2,
        dashArray: '6, 6'
      });
      layersRef.current.highRiskGroup.addLayer(circle);
    });
  }, [
    userLocation, useRadiusFilter, radiusKm, showShelters, showMedical, showSupplies, showFacilities, showDangerFlags, decryptedFlags, btnLevel
  ]);

  // 7. 導航路線 (Polyline) 繪製
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layersRef.current.routeLine) {
      map.removeLayer(layersRef.current.routeLine);
      layersRef.current.routeLine = null;
    }

    if (navTarget && userLocation) {
      const latlngs = [
        [userLocation.lat, userLocation.lng],
        [navTarget.lat, navTarget.lng]
      ];

      layersRef.current.routeLine = L.polyline(latlngs, {
        color: '#10b981',
        weight: 6,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(map);

      map.fitBounds(layersRef.current.routeLine.getBounds(), { padding: [80, 80] });
    }
  }, [navTarget, userLocation]);

  const startNavigation = (target) => {
    setNavTarget(target);
    if (onSelectDestination) onSelectDestination(target);
  };

  const stopNavigation = () => setNavTarget(null);

  const recenterMap = () => {
    const map = mapInstanceRef.current;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const realLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading,
            speed: pos.coords.speed
          };
          setUserLocation(realLoc);
          setGpsActive(true);
          if (map) map.flyTo([realLoc.lat, realLoc.lng], 15, { animate: true });
        },
        (err) => {
          console.warn('重新取得 GPS 失敗:', err);
          if (map && userLocation) map.flyTo([userLocation.lat, userLocation.lng], 15, { animate: true });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else if (map && userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 15, { animate: true });
    }
  };

  // 8. 螢幕尺寸與直橫向自動偵測
  const { isLandscape, isMobile } = useViewport();

  return (
    <div className="relative w-full h-[calc(var(--vh,1vh)*100-60px)] overflow-hidden">
      {navTarget && (
        <NavigationCard
          target={navTarget}
          userLocation={userLocation}
          onStopNavigation={stopNavigation}
        />
      )}

      <div ref={mapRef} className="w-full h-full z-10" />

      {/* 📢 彈幕廣播動態文字圖層 (從右往左移動) */}
      <DanmakuOverlay danmakuList={danmakuList} />

      {/* 🛡️ 智能網格分區 1：頂部全台 22 縣市定位與災害圖例列 */}
      <div className={`absolute top-3 z-[990] max-w-lg space-y-1.5 transition-all ${
        isLandscape && isMobile ? 'left-16 right-3' : 'left-3 right-3 sm:right-auto'
      }`}>
        <CountySelector
          selectedCountyId={selectedCountyId}
          onSelectCounty={handleSelectCounty}
          onSelectRegion={handleSelectRegion}
          btnLevel={btnLevel}
        />

        <HazardLegendCard
          showShelters={showShelters} setShowShelters={setShowShelters}
          showMedical={showMedical} setShowMedical={setShowMedical}
          showSupplies={showSupplies} setShowSupplies={setShowSupplies}
          showFacilities={showFacilities} setShowFacilities={setShowFacilities}
          showUtility={showUtility} setShowUtility={setShowUtility}
          showBlockade={showBlockade} setShowBlockade={setShowBlockade}
          showCasualty={showCasualty} setShowCasualty={setShowCasualty}
          showRadius={useRadiusFilter} setShowRadius={setUseRadiusFilter}
          showInvasion={showInvasion} setShowInvasion={setShowInvasion}
          showMissile={showMissile} setShowMissile={setShowMissile}
          showCoastal={showCoastal} setShowCoastal={setShowCoastal}
        />
      </div>

      {/* 🛡️ 智能網格分區 2：廣播發話列 (畫面中央置中，支援上下自由拖動) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[990] w-full max-w-lg px-3 transition-all pointer-events-auto flex flex-col gap-2">
        {/* 1. 敵佔領與快艇推進 30 分鐘時間軸 (位於上方) */}
        {showInvasion && (
          <InvasionPlaybackBar
            currentStepIndex={currentInvasionStep}
            setCurrentStepIndex={setCurrentInvasionStep}
          />
        )}

        {/* 2. 即時彈幕發話列 (畫面中央置中，支援上下自由拖曳) */}
        <DanmakuInputBar onSendDanmaku={handleSendDanmaku} />
      </div>

      {/* 🛡️ 智能網格分區 3：右側側邊功能欄 (獨立動態定位，絕對零遮擋) */}
      <div className={`absolute bottom-3 z-[995] flex flex-col gap-1.5 transition-all ${
        isLandscape && isMobile ? 'left-16' : 'right-3'
      }`}>
        {/* 1. 我的位置 */}
        <Tooltip text="我的位置：重新定位至 GPS 動態座標" position="left">
          <button
            onClick={recenterMap}
            className={`bg-slate-900/95 border border-emerald-500 hover:bg-slate-800 text-emerald-400 font-black shadow-xl flex items-center justify-center active:scale-95 backdrop-blur-md transition-all ${
              btnLevel === 1 ? 'w-[25px] h-[25px] p-0 rounded-lg text-[10px]' :
              btnLevel === 2 ? 'w-[33px] h-[33px] p-1 text-xs rounded-xl' :
              btnLevel === 3 ? 'h-[36px] px-2 py-1 text-xs rounded-xl gap-1.5' :
              btnLevel === 4 ? 'h-[42px] px-2.5 py-1.5 text-xs rounded-xl gap-1.5' :
              'h-[50px] px-3.5 py-2 text-senior-sm rounded-2xl font-black gap-2'
            }`}
          >
            <Navigation className={`animate-pulse text-emerald-400 shrink-0 ${btnLevel <= 2 ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            {btnLevel >= 3 && <span className="text-xs text-white hidden sm:inline">我的位置</span>}
          </button>
        </Tooltip>

        {/* 2. 📤 分享 GPS 座標與救援位置 */}
        <Tooltip text="分享座標：開啟精準度提醒並傳送救援座標給好友" position="left">
          <button
            onClick={() => setIsGPSShareOpen(true)}
            className={`bg-teal-950/95 border border-teal-400 hover:bg-teal-900 text-teal-300 font-black shadow-xl flex items-center justify-center active:scale-95 backdrop-blur-md transition-all ${
              btnLevel === 1 ? 'w-[25px] h-[25px] p-0 rounded-lg text-[10px]' :
              btnLevel === 2 ? 'w-[33px] h-[33px] p-1 text-xs rounded-xl' :
              btnLevel === 3 ? 'h-[36px] px-2 py-1 text-xs rounded-xl gap-1.5' :
              btnLevel === 4 ? 'h-[42px] px-2.5 py-1.5 text-xs rounded-xl gap-1.5' :
              'h-[50px] px-3.5 py-2 text-senior-sm rounded-2xl font-black gap-2'
            }`}
          >
            <Share2 className={`text-teal-400 animate-bounce-short shrink-0 ${btnLevel <= 2 ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            {btnLevel >= 3 && <span className="text-xs text-white hidden sm:inline">分享座標</span>}
          </button>
        </Tooltip>

        {/* 3. 新增彩色災害圈 */}
        <Tooltip text="新增彩色圈：劃定停水(卡其)/封路(橘)/傷亡(紅)區域" position="left">
          <button
            onClick={() => setIsAddHazardOpen(true)}
            className={`bg-amber-950/95 border border-amber-500 hover:bg-amber-900 text-amber-300 font-black shadow-xl flex items-center justify-center active:scale-95 backdrop-blur-md transition-all ${
              btnLevel === 1 ? 'w-[25px] h-[25px] p-0 rounded-lg text-[10px]' :
              btnLevel === 2 ? 'w-[33px] h-[33px] p-1 text-xs rounded-xl' :
              btnLevel === 3 ? 'h-[36px] px-2 py-1 text-xs rounded-xl gap-1.5' :
              btnLevel === 4 ? 'h-[42px] px-2.5 py-1.5 text-xs rounded-xl gap-1.5' :
              'h-[50px] px-3.5 py-2 text-senior-sm rounded-2xl font-black gap-2'
            }`}
          >
            <CircleDot className={`text-amber-400 animate-spin-slow shrink-0 ${btnLevel <= 2 ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            {btnLevel >= 3 && <span className="text-xs text-white hidden sm:inline">新增彩色圈</span>}
          </button>
        </Tooltip>

        {/* 4. 標記危險地區 (旗標) */}
        <Tooltip text="標記危險區：放置 AES-GCM 暗碼加密危險旗標" position="left">
          <button
            onClick={() => setIsAddFlagOpen(true)}
            className={`bg-rose-950/95 border border-rose-500 hover:bg-rose-900 text-rose-300 font-black shadow-xl flex items-center justify-center active:scale-95 backdrop-blur-md transition-all ${
              btnLevel === 1 ? 'w-[25px] h-[25px] p-0 rounded-lg text-[10px]' :
              btnLevel === 2 ? 'w-[33px] h-[33px] p-1 text-xs rounded-xl' :
              btnLevel === 3 ? 'h-[36px] px-2 py-1 text-xs rounded-xl gap-1.5' :
              btnLevel === 4 ? 'h-[42px] px-2.5 py-1.5 text-xs rounded-xl gap-1.5' :
              'h-[50px] px-3.5 py-2 text-senior-sm rounded-2xl font-black gap-2'
            }`}
          >
            <Flag className={`text-rose-400 fill-rose-500 shrink-0 ${btnLevel <= 2 ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            {btnLevel >= 3 && <span className="text-xs text-white hidden sm:inline">標記危險區</span>}
          </button>
        </Tooltip>

        {/* 5. 每日情報紀錄 */}
        <Tooltip text="每日情報：日期檢視每日地圖狀況日誌" position="left">
          <button
            onClick={() => setIsDailyIntelOpen(true)}
            className={`bg-slate-900/95 border border-slate-600 hover:bg-slate-800 text-slate-300 font-black shadow-xl flex items-center justify-center active:scale-95 backdrop-blur-md transition-all ${
              btnLevel === 1 ? 'w-[25px] h-[25px] p-0 rounded-lg text-[10px]' :
              btnLevel === 2 ? 'w-[33px] h-[33px] p-1 text-xs rounded-xl' :
              btnLevel === 3 ? 'h-[36px] px-2 py-1 text-xs rounded-xl gap-1.5' :
              btnLevel === 4 ? 'h-[42px] px-2.5 py-1.5 text-xs rounded-xl gap-1.5' :
              'h-[50px] px-3.5 py-2 text-senior-sm rounded-2xl font-black gap-2'
            }`}
          >
            <Calendar className={`text-slate-300 shrink-0 ${btnLevel <= 2 ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            {btnLevel >= 3 && <span className="text-xs text-white hidden sm:inline">每日情報</span>}
          </button>
        </Tooltip>
      </div>

      {/* 📡 GPS 分享與 Wi-Fi 精準度提醒 Modal */}
      <GPSShareModal
        isOpen={isGPSShareOpen}
        onClose={() => setIsGPSShareOpen(false)}
        userLocation={userLocation}
      />

      {/* Modal 彈窗元件 */}
      <AddDangerFlagModal
        isOpen={isAddFlagOpen}
        onClose={() => setIsAddFlagOpen(false)}
        userLocation={userLocation}
        cipherCode={cipherCode}
        onFlagAdded={loadAndDecryptData}
      />

      <AddHazardZoneModal
        isOpen={isAddHazardOpen}
        onClose={() => setIsAddHazardOpen(false)}
        userLocation={userLocation}
        cipherCode={cipherCode}
        onHazardAdded={loadAndDecryptData}
      />

      <DailyIntelModal
        isOpen={isDailyIntelOpen}
        onClose={() => setIsDailyIntelOpen(false)}
      />
    </div>
  );
}
