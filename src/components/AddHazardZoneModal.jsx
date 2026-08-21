import React, { useState } from 'react';
import { AlertTriangle, Lock, X, CircleDot, Droplets } from 'lucide-react';
import { encryptHazardZone } from '../services/crypto';
import { saveCustomHazardZone } from '../services/storage';

export default function AddHazardZoneModal({ isOpen, onClose, userLocation, cipherCode, onHazardAdded }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('utility_outage');
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
    let color = '#c2b280'; // 卡其色代表停水無水可用
    let typeName = '💧 停水停電區 (卡其色無水區)';

    if (type === 'road_blockade') {
      color = '#ea580c';
      typeName = '🚧 禁止通行 / 封橋封路區';
    } else if (type === 'casualty_destruction') {
      color = '#dc2626';
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
    alert(`✅ 已成功圈出範圍圈 (${typeName} / 半徑 ${radiusMeters}m)！僅對齊暗碼之親友可正常解密檢視。`);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-amber-500 rounded-3xl p-5 max-w-md w-full text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-senior-lg">
            <CircleDot className="w-8 h-8 text-amber-400 animate-spin-slow" />
            <span>新增彩色災害範圍圈</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800">
            <X className="w-7 h-7" />
          </button>
        </div>

        <div className="bg-amber-950/60 border border-amber-800/80 rounded-2xl p-3 flex items-start gap-3">
          <Lock className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
          <div className="text-senior-sm text-amber-200">
            此範圍圈將以暗碼 <strong className="text-amber-300">『{cipherCode || '未設定'}』</strong> 端到端加密，避免情報遭敵方或外人反偵查。
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-senior-sm font-bold text-slate-200 mb-1">
              災害與警戒區名稱 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：中正區幹線斷水 / 停電區"
              className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl p-3 text-senior-base text-white focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-senior-sm font-bold text-slate-200 mb-1">
              選擇災害類型 (彩色標示)
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setType('utility_outage')}
                className={`w-full p-3 rounded-2xl font-bold text-senior-sm border-2 text-left flex items-center justify-between transition-all ${
                  type === 'utility_outage'
                    ? 'bg-[#4a4228] border-[#c2b280] text-[#e8dfbe] shadow-md scale-[1.02]'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-[#c2b280]" />
                  <span>💧 停水停電區 (卡其色 - 代表無水可用)</span>
                </div>
                <span className="w-4 h-4 rounded-full bg-[#c2b280]"></span>
              </button>

              <button
                type="button"
                onClick={() => setType('road_blockade')}
                className={`w-full p-3 rounded-2xl font-bold text-senior-sm border-2 text-left flex items-center justify-between transition-all ${
                  type === 'road_blockade'
                    ? 'bg-orange-950 border-orange-500 text-orange-300 shadow-md scale-[1.02]'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span>🚧 禁止通行 / 封橋封路區 (橘色圈)</span>
                <span className="w-4 h-4 rounded-full bg-orange-500"></span>
              </button>

              <button
                type="button"
                onClick={() => setType('casualty_destruction')}
                className={`w-full p-3 rounded-2xl font-bold text-senior-sm border-2 text-left flex items-center justify-between transition-all ${
                  type === 'casualty_destruction'
                    ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md scale-[1.02]'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span>💥 傷亡與建物嚴重破壞區 (深紅色圈)</span>
                <span className="w-4 h-4 rounded-full bg-rose-600"></span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-senior-sm font-bold text-slate-200 mb-1">
              災害圈影響半徑範圍 (公尺)
            </label>
            <select
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(e.target.value)}
              className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl p-3 text-senior-lg font-bold text-amber-300 focus:border-amber-500 focus:outline-none"
            >
              <option value={300}>300 公尺 (小區域 / 巷道管制)</option>
              <option value={500}>500 公尺 (中等區域 / 街區警戒)</option>
              <option value={1000}>1000 公尺 (1公里 / 大範圍管制)</option>
              <option value={2000}>2000 公尺 (2公里 / 重大災害區)</option>
            </select>
          </div>

          <div>
            <label className="block text-senior-sm font-bold text-slate-200 mb-1">
              詳細說明與避開建議 (選填)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：自來水幹管斷裂無水可用；附近水車位於公園旁..."
              rows={2}
              className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl p-3 text-senior-base text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-2xl font-bold text-senior-base text-slate-300"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-amber-600 hover:bg-amber-500 py-3 rounded-2xl font-black text-senior-base text-slate-950 shadow-lg flex items-center justify-center gap-2 active:scale-95"
            >
              <Lock className="w-5 h-5" />
              <span>加密生成卡其/彩色圈</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
