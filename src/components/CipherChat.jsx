import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Send, Key } from 'lucide-react';
import { encryptMessage, decryptMessage } from '../services/crypto';
import { getStoredCipherCode, setStoredCipherCode, getStoredMessages, saveMessage } from '../services/storage';

export default function CipherChat({ cipherCode, setCipherCode }) {
  const [inputCode, setInputCode] = useState(cipherCode || '');
  const [messages, setMessages] = useState([]);
  const [decryptedList, setDecryptedList] = useState([]);
  const [inputText, setInputText] = useState('');
  const [senderName, setSenderName] = useState('長輩/親友');

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

  // 即時解密訊息清單
  useEffect(() => {
    let isMounted = true;
    async function decryptAll() {
      const result = await Promise.all(
        messages.map(async (m) => {
          if (m.isEncrypted) {
            const dec = await decryptMessage(m.text, cipherCode);
            const isSuccess = !dec.startsWith('🔒') && !dec.startsWith('⚠️');
            return { ...m, decryptedText: dec, isUnlocked: isSuccess };
          }
          return { ...m, decryptedText: m.text, isUnlocked: true };
        })
      );
      if (isMounted) setDecryptedList(result);
    }
    decryptAll();
    return () => { isMounted = false; };
  }, [messages, cipherCode]);

  // 發送加密訊息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!cipherCode) {
      if (!confirm('⚠️ 當前未設定『暗碼』，訊息將以一般文字發送。是否繼續？')) {
        return;
      }
    }

    const cipherText = cipherCode
      ? await encryptMessage(inputText, cipherCode)
      : inputText;

    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: senderName || '親友',
      text: cipherText,
      isEncrypted: !!cipherCode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = saveMessage(newMsg);
    setMessages(updated);
    setInputText('');
  };

  // 一鍵發送平安心跳
  const sendQuickHeartbeat = () => {
    setInputText(`🟢 [平安心跳] 我目前平安，無須擔心！ (${new Date().toLocaleTimeString()})`);
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

        <form onSubmit={handleSaveCipher} className="flex gap-2">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="請輸入親友約定暗碼 (如: FAMILY888)"
            className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-[15px] font-bold text-amber-300 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-[15px] shadow active:scale-95 border border-cyan-300 shrink-0"
          >
            設定對齊
          </button>
        </form>

        <p className="text-[12px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700 leading-normal">
          💡 <strong>防駭保護：</strong>所有群組訊息皆使用 AES-GCM 256-bit 在本地加密。未輸入對應暗碼的外人無法解析此對話。
        </p>
      </div>

      {/* 暱稱設定 */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[13px] font-bold text-slate-300">您的暱稱：</span>
        <input
          type="text"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1 text-[13px] text-white font-bold w-32"
        />
      </div>

      {/* 對話歷史紀錄 (文字大小為 15px) */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-3 shadow-inner min-h-[260px] max-h-[360px] overflow-y-auto space-y-2.5">
        {decryptedList.map((m) => {
          const isMe = m.sender === senderName;
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
            className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-[15px] text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-[15px] shadow active:scale-95 flex items-center gap-1.5 border border-emerald-400 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>發送</span>
          </button>
        </div>
      </form>
    </div>
  );
}
