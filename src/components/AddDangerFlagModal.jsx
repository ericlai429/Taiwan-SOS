import React, { useState } from 'react';
import { Flag, Lock, X } from 'lucide-react';
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

    const encryptedFlag = await encryptDangerFlag(flagPayload, cipherCode);
    saveDangerFlag(encryptedFlag);

    setIsSubmitting(false);
    setTitle('');
    setDescription('');
    onFlagAdded();
    onClose();
    alert('✅ 危險旗標已加密標記至地圖！僅對齊暗碼之親友可解密檢視。');
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      {/* 縮小 50% 的精簡危險旗標 Modal 視窗 */}
      <div className="bg-slate-900 border-2 border-rose-600 rounded-2xl p-3.5 max-w-sm w-full text-white shadow-2xl space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <div className="flex items-center gap-1.5 text-rose-500 font-extrabold text-xs sm:text-sm">
            <Flag className="w-4 h-4 fill-rose-600 text-rose-600 animate-pulse" />
            <span>標記危險地區 (旗標)</span>
          </div>
          <button onClick={onClose} className="p-0.5 text-slate-400 hover:text-white rounded-full bg-slate-800 border border-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-rose-950/60 border border-rose-800/80 rounded-xl p-2 flex items-start gap-2 text-[10px] text-rose-200">
          <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            以暗碼 <strong className="text-amber-300">『{cipherCode || '未設定'}』</strong> 加密保護，未對齊者無法檢視。
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2 text-xs">
          <div>
            <label className="block font-bold text-slate-200 mb-1">
              危險區域名稱 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：忠孝路口坍方封鎖"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2 text-xs text-white focus:border-rose-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-200 mb-1">
              警戒等級
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setLevel('high')}
                className={`py-1.5 rounded-xl font-bold border transition-all ${
                  level === 'high'
                    ? 'bg-rose-600 border-white text-white shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                🚨 高危險
              </button>
              <button
                type="button"
                onClick={() => setLevel('medium')}
                className={`py-1.5 rounded-xl font-bold border transition-all ${
                  level === 'medium'
                    ? 'bg-amber-600 border-white text-white shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                ⚠️ 中警戒
              </button>
              <button
                type="button"
                onClick={() => setLevel('low')}
                className={`py-1.5 rounded-xl font-bold border transition-all ${
                  level === 'low'
                    ? 'bg-yellow-600 border-white text-white shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                🔍 威脅
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-200 mb-1">
              補充說明 (選填)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="建議繞道至仁愛路方向避難..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2 text-xs text-white focus:border-rose-500 focus:outline-none"
            />
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
              className="flex-1 bg-rose-600 hover:bg-rose-500 py-1.5 rounded-xl font-bold text-xs text-white shadow flex items-center justify-center gap-1 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>加密送出</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
