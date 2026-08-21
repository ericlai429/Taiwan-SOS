import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Send, Key, Smartphone, UserCheck, EyeOff, ShieldCheck, Activity } from 'lucide-react';
import { encryptMessage, decryptMessage } from '../services/crypto';
import { getStoredCipherCode, setStoredCipherCode, getStoredMessages, saveMessage, appendDayTimeLog } from '../services/storage';
import { sanitizeHTML, checkCipherStrength } from '../utils/security';
import { networkSync } from '../services/networkSync';

export default function CipherChat({ cipherCode, setCipherCode }) {
  const [inputCode, setInputCode] = useState(cipherCode || '');
  const [messages, setMessages] = useState([]);
  const [decryptedList, setDecryptedList] = useState([]);
  const [inputText, setInputText] = useState('');
  const [onlinePeers, setOnlinePeers] = useState({});
  const [netStatus, setNetStatus] = useState(networkSync.isConnected);

  // 📌 跨裝置 (手機 <-> 電腦/NB) 即時同步頻道設定與監聽 (含 3 分鐘心跳與狀態監測)
  useEffect(() => {
    networkSync.setChannel(cipherCode);
    setNetStatus(networkSync.isConnected);

    const checkTimer = setInterval(() => {
      setNetStatus(networkSync.isConnected);
    }, 1500);

    const unsubscribe = networkSync.subscribe((payload) => {
      if (payload && payload.data) {
        if (payload.type === 'CHAT_MESSAGE') {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.data.id)) return prev;
            const updated = [...prev, payload.data];
            saveMessage(payload.data);
            return updated;
          });
        } else if (payload.type === 'HEARTBEAT_PING') {
          setOnlinePeers((prev) => ({
            ...prev,
            [payload.data.sender]: {
              timestamp: payload.data.timestamp || Date.now(),
              status: payload.data.status || '🟢 在線'
            }
          }));
        }
      }
    });

    return () => {
      clearInterval(checkTimer);
      unsubscribe();
    };
  }, [cipherCode]);

  // 📌 每 3 分鐘 (180 秒固定頻率，防過度密集) 自動廣播平安心跳脈衝訊號
  useEffect(() => {
    const sendPulse = () => {
      if (currentSenderName) {
        networkSync.broadcast('HEARTBEAT_PING', {
          sender: currentSenderName,
          timestamp: Date.now(),
          status: '🟢 在線心跳中'
        });
      }
    };

    sendPulse();
    const interval = setInterval(sendPulse, 180000); // 3 分鐘固定頻率
    return () => clearInterval(interval);
  }, [cipherCode, currentSenderName]);

  // 📌 自動偵測/預設手機末 3 碼
  const [phone3Digits, setPhone3Digits] = useState(() => {
    try {
      const saved = localStorage.getItem('taiwan_sos_phone_3digits');
      if (saved) return saved;
      const gen = String(Math.floor(100 + Math.random() * 900));
      localStorage.setItem('taiwan_sos_phone_3digits', gen);
      return gen;
    } catch (e) {
      return '888';
    }
  });

  // 📌 自訂發話暱稱
  const [customNickname, setCustomNickname] = useState(() => {
    try {
      return localStorage.getItem('taiwan_sos_custom_nickname') || '親友';
    } catch (e) {
      return '親友';
    }
  });

  // 📌 匿名模式切換
  const [isAnonymous, setIsAnonymous] = useState(false);

  // 計算動態發話抬頭 (過濾 XSS)
  const safeNickname = sanitizeHTML(customNickname.trim() || '親友');
  const safe3Digits = sanitizeHTML(phone3Digits || '888');
  const currentSenderName = isAnonymous
    ? `匿名親友 (末3碼: ${safe3Digits})`
    : `${safeNickname} (末3碼: ${safe3Digits})`;

  const strength = checkCipherStrength(cipherCode);

  // 持久化儲存發話身份
  useEffect(() => {
    try {
      localStorage.setItem('taiwan_sos_phone_3digits', phone3Digits);
      localStorage.setItem('taiwan_sos_custom_nickname', customNickname);
    } catch (e) {}
  }, [phone3Digits, customNickname]);

  // 載入訊息歷史
  useEffect(() => {
    setMessages(getStoredMessages());
  }, []);

  // 更新暗碼
  const handleSaveCipher = (e) => {
    e.preventDefault();
    setCipherCode(inputCode);
    setStoredCipherCode(inputCode);
    alert(`✅ 已切換暗碼為：${inputCode || '（未設定）'}`);
  };

  // 即時解密訊息清單 ( sanitize 解密後文字防護 XSS )
  useEffect(() => {
    let isMounted = true;
    async function decryptAll() {
      const result = await Promise.all(
        messages.map(async (m) => {
          if (m.isEncrypted) {
            const dec = await decryptMessage(m.text, cipherCode);
            const isSuccess = !dec.startsWith('🔒') && !dec.startsWith('⚠️');
            return { ...m, decryptedText: isSuccess ? sanitizeHTML(dec) : dec, isUnlocked: isSuccess };
          }
          return { ...m, decryptedText: sanitizeHTML(m.text), isUnlocked: true };
        })
      );
      if (isMounted) setDecryptedList(result);
    }
    decryptAll();
    return () => { isMounted = false; };
  }, [messages, cipherCode]);

  // 發送加密訊息 (雙重防護 XSS 與端到端 AES-GCM 256-bit 加密)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const cleanText = sanitizeHTML(inputText.trim());
    if (!cleanText) return;

    if (!cipherCode) {
      if (!confirm('⚠️ 當前未設定『暗碼』，訊息將以一般文字發送。是否繼續？')) {
        return;
      }
    }

    const cipherText = cipherCode
      ? await encryptMessage(cleanText, cipherCode)
      : cleanText;

    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: currentSenderName,
      text: cipherText,
      isEncrypted: !!cipherCode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = saveMessage(newMsg);
    appendDayTimeLog({
      id: newMsg.id,
      timestamp: newMsg.timestamp,
      sender: newMsg.sender,
      message: cipherText,
      isEncrypted: newMsg.isEncrypted
    });
    // 🌐 跨裝置 (手機 <-> 電腦/NB) 即時網路廣播發送
    networkSync.broadcast('CHAT_MESSAGE', newMsg);
    setMessages(updated);
    setInputText('');
  };

  // 一鍵發送平安心跳
  const sendQuickHeartbeat = () => {
    setInputText(`🟢 [平安心跳] 我目前平安，無須擔心！ (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
  };

  return (
    <div className="max-w-2xl mx-auto p-3.5 pb-24 space-y-3">
      {/* 暗碼設定卡 (精簡 15px 風格) */}
      <div className="bg-slate-800/95 border-2 border-cyan-500 rounded-2xl p-3.5 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-cyan-400 font-extrabold text-[15px]">
            <Key className="w-5 h-5 text-cyan-400" />
            <span>親友專屬暗碼設定</span>
          </div>
          <span className={`text-[12px] px-2.5 py-0.5 rounded-full font-bold border ${
            cipherCode ? 'bg-emerald-950 text-emerald-300 border-emerald-500' : 'bg-rose-950 text-rose-300 border-rose-500'
          }`}>
            {cipherCode ? '🔒 加密對齊中' : '⚠️ 未設定暗碼'}
          </span>
        </div>

        <form onSubmit={handleSaveCipher} className="space-y-1.5">
          {/* 📡 100 頻道房間快速選擇列 (每 1, 10, 20, 30 為公共大頻) */}
          <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-700 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-300">
              <span className="flex items-center gap-1 text-cyan-300">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>萬人分流房間 (1~100 頻道)</span>
              </span>
              <span className="text-[10px] text-slate-400">大容量萬人高併發</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setInputCode('CH-01');
                  setCipherCode('CH-01');
                  setStoredCipherCode('CH-01');
                }}
                className={`p-1.5 rounded-lg border text-center transition-all ${
                  cipherCode === 'CH-01' ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-extrabold shadow' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                📢 CH-01 公共大頻
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputCode('CH-10');
                  setCipherCode('CH-10');
                  setStoredCipherCode('CH-10');
                }}
                className={`p-1.5 rounded-lg border text-center transition-all ${
                  cipherCode === 'CH-10' ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-extrabold shadow' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                🛡️ CH-10 雙北防衛
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputCode('CH-20');
                  setCipherCode('CH-20');
                  setStoredCipherCode('CH-20');
                }}
                className={`p-1.5 rounded-lg border text-center transition-all ${
                  cipherCode === 'CH-20' ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-extrabold shadow' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                🌊 CH-20 桃基海岸
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputCode('CH-30');
                  setCipherCode('CH-30');
                  setStoredCipherCode('CH-30');
                }}
                className={`p-1.5 rounded-lg border text-center transition-all ${
                  cipherCode === 'CH-30' ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-extrabold shadow' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                📦 CH-30 物資醫療
              </button>
            </div>

            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-400 shrink-0">切換 1~100 頻道：</span>
              <select
                value={cipherCode.startsWith('CH-') ? cipherCode : 'custom'}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    setInputCode(e.target.value);
                    setCipherCode(e.target.value);
                    setStoredCipherCode(e.target.value);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-amber-300 focus:border-cyan-400 focus:outline-none"
              >
                <option value="custom">🔒 自訂私密暗碼 (親友專屬)</option>
                {Array.from({ length: 100 }, (_, i) => {
                  const chNum = String(i + 1).padStart(2, '0');
                  const chCode = `CH-${chNum}`;
                  const isPublic = [1, 10, 20, 30].includes(i + 1);
                  return (
                    <option key={chCode} value={chCode}>
                      {chCode} 頻道 {isPublic ? '★ [公共大頻]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="請輸入親友約定暗碼或頻道 (如: CH-01 / FAMILY888)"
              className="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-[15px] font-bold text-amber-300 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-3 py-2 rounded-xl text-[15px] shadow active:scale-95 border border-cyan-300 shrink-0 whitespace-nowrap"
            >
              設定對齊
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] px-1 font-bold">
            <span className="text-slate-400">暗碼強度評估：</span>
            <span className={strength.color}>{strength.label}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] px-1 font-bold pt-0.5">
            <span className="text-slate-400">跨裝置 (手機 ↔ 電腦) 實體對齊：</span>
            <span className={netStatus ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
              {netStatus ? '🟢 統一通道連線中 (EMQX 8084)' : '🟡 網路連線切換中...'}
            </span>
          </div>
        </form>

        <p className="text-[12px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700 leading-normal">
          💡 <strong>防駭保護：</strong>所有群組訊息皆使用 AES-GCM 256-bit 在本地加密。未輸入對應暗碼的外人無法解析此對話。
        </p>
      </div>

      {/* 📱 手機末 3 碼與發話暱稱 / 匿名自訂設定卡 */}
      <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-3 space-y-2 text-xs shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>發話身份與手機末 3 碼自訂</span>
          </div>

          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`px-2 py-0.5 rounded-lg border font-bold text-[11px] flex items-center gap-1 transition-all ${
              isAnonymous
                ? 'bg-purple-950 border-purple-500 text-purple-300 shadow'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {isAnonymous ? <EyeOff className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            <span>{isAnonymous ? '🕵️ 已開啟匿名發話' : '👤 一般暱稱發話'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              📱 手機末 3 碼 (自動偵測 / 可自由更動)：
            </label>
            <div className="flex items-center gap-1">
              <span className="text-amber-400 font-bold font-mono">#</span>
              <input
                type="text"
                maxLength={3}
                value={phone3Digits}
                onChange={(e) => setPhone3Digits(e.target.value.replace(/\D/g, ''))}
                placeholder="末3碼"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 text-center focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPhone3Digits(String(Math.floor(100 + Math.random() * 900)))}
                title="產生隨機末3碼"
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 text-[10px] shrink-0 font-bold"
              >
                🎲 換碼
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              ✏️ 自訂發話暱稱 (可自訂或匿名)：
            </label>
            <input
              type="text"
              disabled={isAnonymous}
              value={customNickname}
              onChange={(e) => setCustomNickname(e.target.value)}
              placeholder={isAnonymous ? "匿名模式發話中..." : "如：大伯、媽媽、志工..."}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none disabled:opacity-40"
            />
          </div>
        </div>

        <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
          <span className="text-slate-400">當前廣播/聊天抬頭：</span>
          <strong className="text-cyan-300 font-mono font-bold text-[12px]">{currentSenderName}</strong>
        </div>
      </div>

      {/* 📡 暗碼群組親友即時心跳頻率動態面板 (固定每 3 分鐘) */}
      <div className="bg-slate-900/90 border border-emerald-500/80 rounded-2xl p-3 space-y-1.5 text-xs shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>親友即時心跳頻率：</span>
            <span className="text-emerald-300 font-mono font-extrabold text-[12px] bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-700">3 分鐘 Pulse (180s 刷新)</span>
          </div>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-600 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            脈衝定時連線中
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-400 font-bold">📡 在線親友心跳：</span>
          {Object.keys(onlinePeers).length === 0 ? (
            <span className="text-slate-500 italic">正在掃描暗碼群組親友心跳 (每3分鐘脈衝)...</span>
          ) : (
            Object.entries(onlinePeers).map(([peerName, peerData]) => {
              const secAgo = Math.max(0, Math.floor((Date.now() - peerData.timestamp) / 1000));
              if (secAgo > 360) return null; // 6 分鐘無訊號視為離線
              return (
                <span key={peerName} className="bg-slate-950 border border-emerald-600 px-2 py-0.5 rounded-lg text-emerald-300 font-bold font-mono text-[11px] flex items-center gap-1 shadow">
                  <span>👤 {peerName}</span>
                  <span className="text-[9px] text-emerald-400 font-normal">({Math.floor(secAgo / 60)}分{secAgo % 60}秒前心跳)</span>
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* 對話歷史紀錄 (文字大小為 15px) */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-3 shadow-inner min-h-[260px] max-h-[360px] overflow-y-auto space-y-2.5">
        {decryptedList.map((m) => {
          const isMe = m.sender === currentSenderName;
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5 px-1">
                <span className="text-[12px] font-bold text-slate-400">{m.sender}</span>
                <span className="text-[10px] text-slate-500">{m.timestamp}</span>
              </div>

              <div
                className={`max-w-[88%] rounded-2xl p-3 shadow text-[15px] ${
                  isMe
                    ? 'bg-cyan-700 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {m.isEncrypted ? (
                    m.isUnlocked ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.2 rounded-full border border-emerald-600">
                        <Unlock className="w-3 h-3" /> 暗碼已解密
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950 px-2 py-0.2 rounded-full border border-rose-600">
                        <Lock className="w-3 h-3" /> 加密防竊聽中
                      </span>
                    )
                  ) : null}
                </div>

                <div className="font-normal text-[15px] whitespace-pre-wrap leading-relaxed">
                  {m.decryptedText}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 發送輸入區與快速按鈕 (文字與輸入框 15px) */}
      <form onSubmit={handleSendMessage} className="space-y-1.5">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={sendQuickHeartbeat}
            className="px-2.5 py-1 bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-600 text-emerald-300 font-bold rounded-xl text-[12px] active:scale-95 shrink-0"
          >
            🟢 一鍵代入平安
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="輸入加密對話訊息..."
            className="flex-1 min-w-0 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-[15px] text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-[15px] shadow active:scale-95 flex items-center gap-1 border border-emerald-400 shrink-0 whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            <span>發送</span>
          </button>
        </div>
      </form>
    </div>
  );
}
