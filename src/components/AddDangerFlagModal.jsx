import React, { useState, useEffect } from 'react';
import { Flag, Lock, X, Trash2, Edit3 } from 'lucide-react';
import { encryptDangerFlag } from '../services/crypto';
import { saveDangerFlag, updateDangerFlagDetails, deleteDangerFlag } from '../services/storage';
import { inspectAndSanitizeInput } from '../services/securityLogger';

export default function AddDangerFlagModal({
  isOpen,
  onClose,
  userLocation,
  targetLocation,
  editingFlag,
  cipherCode,
  onFlagAdded
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('high'); // high, medium, low
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingFlag) {
      setTitle(editingFlag.title || '');
      setDescription(editingFlag.description || '');
      setLevel(editingFlag.level || 'high');
    } else {
      setTitle('');
      setDescription('');
      setLevel('high');
    }
  }, [editingFlag, isOpen]);

  if (!isOpen) return null;

  const loc = editingFlag
    ? { lat: editingFlag.lat, lng: editingFlag.lng }
    : (targetLocation || userLocation || { lat: 25.0478, lng: 121.5170 });

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

    // 🛡️ 200 字上限與惡意語法過濾
    const inspectedTitle = inspectAndSanitizeInput(title, '危險旗標名稱');
    if (inspectedTitle.errorMsg) alert(inspectedTitle.errorMsg);
    const cleanTitle = inspectedTitle.sanitized;
    if (!cleanTitle) return;

    const inspectedDesc = inspectAndSanitizeInput(description, '危險旗標補充說明');
    if (inspectedDesc.errorMsg) alert(inspectedDesc.errorMsg);
    const cleanDesc = inspectedDesc.sanitized;

    setIsSubmitting(true);

    if (editingFlag) {
      // ✏️ 雙擊編輯模式：更新現有旗標情報並重新加密
      await updateDangerFlagDetails(
        editingFlag.id,
        {
          title: cleanTitle,
          description: cleanDesc,
          level,
          lat: Number(loc.lat.toFixed(4)),
          lng: Number(loc.lng.toFixed(4)),
          updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        cipherCode
      );
      setIsSubmitting(false);
      onFlagAdded();
      onClose();
      alert(`✅ 已成功更新【${cleanTitle}】情報並重新完成 AES-GCM 加密！`);
    } else {
      // 🚩 新增旗標模式
      const flagPayload = {
        id: 'flag-' + Date.now(),
        title: cleanTitle,
        description: cleanDesc,
        level,
        lat: Number(loc.lat.toFixed(4)),
        lng: Number(loc.lng.toFixed(4)),
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
    }
  };

  const handleDelete = () => {
    if (!editingFlag) return;
    const confirmed = window.confirm(`⚠️ 確定要永久刪除此危險情報旗標【${editingFlag.title}】嗎？`);
    if (confirmed) {
      deleteDangerFlag(editingFlag.id);
      onFlagAdded();
      onClose();
      alert(`🗑️ 已成功刪除情報旗標【${editingFlag.title}】！`);
    }
  };

  return (
    <div className="fixed inset-0 z-[2600] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      {/* 縮小 50% 的精簡危險旗標 Modal 視窗 */}
      <div className="bg-slate-900 border-2 border-rose-600 rounded-2xl p-3.5 max-w-sm w-full text-white shadow-2xl space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <div className="flex items-center gap-1.5 text-rose-500 font-extrabold text-xs sm:text-sm">
            {editingFlag ? (
              <>
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300">修改危險旗標情報 (雙擊編輯)</span>
              </>
            ) : (
              <>
                <Flag className="w-4 h-4 fill-rose-600 text-rose-600 animate-pulse" />
                <span>標記危險地區 (旗標)</span>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-0.5 text-slate-400 hover:text-white rounded-full bg-slate-800 border border-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1">
            <span className="text-rose-400 font-bold">📍 標定座標：</span>
            <span className="font-mono text-amber-300 font-bold">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            {editingFlag ? '雙擊已選定' : '拖曳已定位'}
          </span>
        </div>

        <div className="bg-rose-950/60 border border-rose-800/80 rounded-xl p-2 flex items-start gap-2 text-[10px] text-rose-200">
          <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            以暗碼 <strong className="text-amber-300">『{cipherCode || '未設定'}』</strong> 加密保護，未對齊者無法檢視。
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2 text-xs">
          <div>
            <label className="block font-bold text-slate-200 mb-1 flex justify-between">
              <span>危險區域名稱 *</span>
              <span className="text-[10px] text-slate-400 font-normal">最多 200 字</span>
            </label>
            <input
              type="text"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value.substring(0, 200))}
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
            <label className="block font-bold text-slate-200 mb-1 flex justify-between">
              <span>補充說明 (選填)</span>
              <span className="text-[10px] text-slate-400 font-normal">最多 200 字</span>
            </label>
            <textarea
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value.substring(0, 200))}
              placeholder="建議繞道至仁愛路方向避難..."
              rows={2}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2 text-xs text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="pt-1 flex gap-2">
            {editingFlag && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-2.5 bg-rose-950 hover:bg-rose-900 border border-rose-700 py-1.5 rounded-xl font-bold text-xs text-rose-300 flex items-center gap-1 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>刪除</span>
              </button>
            )}
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
              <span>{editingFlag ? '重新加密保存' : '加密送出'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
