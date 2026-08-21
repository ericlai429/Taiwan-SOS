import React, { useState } from 'react';
import { Flag, ShieldAlert, Lock, X } from 'lucide-react';
import { encryptDangerFlag } from '../services/crypto';
import { saveDangerFlag } from '../services/storage';

export default function AddDangerFlagModal({ isOpen, onClose, userLocation, cipherCode, onFlagAdded }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('high'); // high, medium, low
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('請輸入危險區域名稱或說明！');
      return;
    }
    if (!cipherCode) {
      alert('⚠️ 請先在暗碼頁面設定『暗碼』，才能加密標記危險地區防範外流！');
      return;
    }

    setIsSubmitting(true);
    const flagPayload = {
      id: 'flag-' + Date.now(),
      title,
      description,
      level,
      lat: userLocation ? userLocation.lat : 25.0478,
      lng: userLocation ? userLocation.lng : 121.5170,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      creator: '親友標記'
    };

    // 端到端暗碼加密旗子數據
    const encryptedFlag = await encryptDangerFlag(flagPayload, cipherCode);
    saveDangerFlag(encryptedFlag);

    setIsSubmitting(false);
    setTitle('');
    setDescription('');
    onFlagAdded();
    onClose();
    alert('✅ 危險旗標已加密標記至地圖！僅對齊暗碼之親友可正常解密檢視。');
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-4 border-rose-600 rounded-3xl p-5 max-w-md w-full text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-rose-500 font-extrabold text-senior-lg">
            <Flag className="w-8 h-8 fill-rose-600 text-rose-600 animate-pulse" />
            <span>標記危險地區 (旗標)</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800">
            <X className="w-7 h-7" />
          </button>
        </div>

        <div className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-3 flex items-start gap-3">
          <Lock className="w-6 h-6 text-rose-400 shrink-0 mt-1" />
          <div className="text-senior-sm text-rose-200">
            此標記將自動以當前暗碼 <strong className="text-amber-300">『{cipherCode || '未設定'}』</strong> 進行加密防駭，未對齊暗碼之外人無法看見精確位置與情報。
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-senior-sm font-bold text-slate-200 mb-1">
              危險區有名稱 / 說明 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：忠孝路口坍方封鎖 / 警告區域"
              className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl p-3 text-senior-base text-white focus:border-rose-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-senior-sm font-bold text-slate-200 mb-1">
              風險警戒等級
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLevel('high')}
                className={`py-3 rounded-2xl font-bold text-senior-sm border-2 transition-all ${
                  level === 'high'
                    ? 'bg-rose-600 border-white text-white shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                🚨 高危險
              </button>
              <button
                type="button"
                onClick={() => setLevel('medium')}
                className={`py-3 rounded-2xl font-bold text-senior-sm border-2 transition-all ${
                  level === 'medium'
                    ? 'bg-amber-600 border-white text-white shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                ⚠️ 中警戒
              </button>
              <button
                type="button"
                onClick={() => setLevel('low')}
                className={`py-3 rounded-2xl font-bold text-senior-sm border-2 transition-all ${
                  level === 'low'
                    ? 'bg-yellow-600 border-white text-white shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                🔍 疑似威脅
              </button>
            </div>
          </div>

          <div>
            <label className="block text-senior-sm font-bold text-slate-200 mb-1">
              補充說明 (選填)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：建議繞道至仁愛路方向避難..."
              rows={2}
              className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl p-3 text-senior-base text-white focus:border-rose-500 focus:outline-none"
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
              className="flex-1 bg-rose-600 hover:bg-rose-500 py-3 rounded-2xl font-black text-senior-base text-white shadow-lg flex items-center justify-center gap-2 active:scale-95"
            >
              <Lock className="w-5 h-5" />
              <span>加密送出旗標</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
