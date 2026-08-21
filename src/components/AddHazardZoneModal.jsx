import React, { useState } from 'react';
import { Lock, X, CircleDot, Droplets, Zap, Ban, Flame } from 'lucide-react';
import { encryptHazardZone } from '../services/crypto';
import { saveCustomHazardZone } from '../services/storage';

export default function AddHazardZoneModal({ isOpen, onClose, userLocation, cipherCode, onHazardAdded }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('utility_outage'); // 'utility_outage', 'power_outage', 'road_blockade', 'casualty_destruction'
  const [radiusMeters, setRadiusMeters] = useState(500);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('請輸入災害區域名稱！');
      return;
    }
    if (!cipherCode) {
      alert('⚠️ 請先在暗碼頁面設定『暗碼』，才能加密標記彩色災害範圍圈防範外流！');
      return;
    }

    setIsSubmitting(true);
    let color = '#c2b280'; // 💧 停水區域
    let typeName = '💧 停水無水區 (卡其色)';

    if (type === 'power_outage') {
      color = '#eab308'; // ⚡ 停電黃色
      typeName = '⚡ 停電跳電區 (閃爍黃色圈)';
    } else if (type === 'road_blockade') {
      color = '#ea580c'; // 🚧 封路橘色
      typeName = '🚧 禁止通行 / 封橋封路區';
    } else if (type === 'casualty_destruction') {
      color = '#dc2626'; // 💥 傷亡深紅色
      typeName = '💥 傷亡與建物嚴重破壞區';
    }

    const hazardPayload = {
      id: 'hazard-custom-' + Date.now(),
      type,
      typeName,
      title,
      description,
      lat: userLocation ? userLocation.lat : 25.0478,
      lng: userLocation ? userLocation.lng : 121.5170,
      radiusMeters: Number(radiusMeters),
      color,
      fillColor: color,
      fillOpacity: 0.35,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const encrypted = await encryptHazardZone(hazardPayload, cipherCode);
    saveCustomHazardZone(encrypted);

    setIsSubmitting(false);
    setTitle('');
    setDescription('');
    onHazardAdded();
    onClose();
    alert(`✅ 已成功圈出範圍圈 (${typeName} / 半徑 ${radiusMeters}m)！僅對齊暗碼之親友可解密檢視。`);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      {/* 縮小 50% 的精簡災害圈 Modal 視窗 */}
      <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl p-3.5 max-w-sm w-full text-white shadow-2xl space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs sm:text-sm">
            <CircleDot className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>新增彩色災害範圍圈</span>
          </div>
          <button onClick={onClose} className="p-0.5 text-slate-400 hover:text-white rounded-full bg-slate-800 border border-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-amber-950/60 border border-amber-800/80 rounded-xl p-2 flex items-start gap-2 text-[10px] text-amber-200">
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            以暗碼 <strong className="text-amber-300">『{cipherCode || '未設定'}』</strong> 端到端加密，避免情報遭外人反偵查。
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2 text-xs">
          <div>
            <label className="block font-bold text-slate-200 mb-1 flex justify-between">
              <span>災害名稱 *</span>
              <span className="text-[10px] text-slate-400 font-normal">最多 200 字</span>
            </label>
            <input
              type="text"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value.substring(0, 200))}
              placeholder="例如：汐止區饋線跳電 / 停電區"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-200 mb-1">
              災害類型 (彩色標示)
            </label>
            <div className="space-y-1 text-[11px]">
              {/* ⚡ 停電黃色區 */}
              <button
                type="button"
                onClick={() => setType('power_outage')}
                className={`w-full p-2 rounded-xl font-bold border text-left flex items-center justify-between transition-all ${
                  type === 'power_outage'
                    ? 'bg-amber-950 border-amber-500 text-amber-300 shadow font-black'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚡ 停電跳電區 (閃爍黃色圈)</span>
                </div>
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              </button>

              {/* 💧 停水區域 */}
              <button
                type="button"
                onClick={() => setType('utility_outage')}
                className={`w-full p-2 rounded-xl font-bold border text-left flex items-center justify-between transition-all ${
                  type === 'utility_outage'
                    ? 'bg-[#4a4228] border-[#c2b280] text-[#e8dfbe] shadow font-black'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-[#c2b280]" />
                  <span>💧 停水區域 (卡其色)</span>
                </div>
                <span className="w-3 h-3 rounded-full bg-[#c2b280]"></span>
              </button>

              {/* 🚧 封橋封路 */}
              <button
                type="button"
                onClick={() => setType('road_blockade')}
                className={`w-full p-2 rounded-xl font-bold border text-left flex items-center justify-between transition-all ${
                  type === 'road_blockade'
                    ? 'bg-orange-950 border-orange-500 text-orange-300 shadow font-black'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-orange-400" />
                  <span>🚧 封橋封路區 (橘色)</span>
                </div>
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              </button>

              {/* 💥 傷亡破壞 */}
              <button
                type="button"
                onClick={() => setType('casualty_destruction')}
                className={`w-full p-2 rounded-xl font-bold border text-left flex items-center justify-between transition-all ${
                  type === 'casualty_destruction'
                    ? 'bg-rose-950 border-rose-500 text-rose-300 shadow font-black'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>💥 傷亡破壞區 (深紅)</span>
                </div>
                <span className="w-3 h-3 rounded-full bg-rose-600"></span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-200 mb-1">
              警戒半徑 (公尺)
            </label>
            <select
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2 text-xs font-bold text-amber-300 focus:border-amber-500 focus:outline-none"
            >
              <option value={300}>300m (小區域 / 巷道)</option>
              <option value={500}>500m (中等 / 街區警戒)</option>
              <option value={1000}>1000m (1km / 大範圍)</option>
              <option value={2000}>2000m (2km / 重大災害)</option>
            </select>
          </div>

          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-1.5 rounded-xl font-bold text-xs text-slate-300"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-amber-600 hover:bg-amber-500 py-1.5 rounded-xl font-bold text-xs text-slate-950 shadow flex items-center justify-center gap-1 active:scale-95 font-black"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>加密生成範圍圈</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
