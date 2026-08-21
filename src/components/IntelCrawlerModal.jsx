import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Radio, Clock, ThumbsUp, ThumbsDown, Lock, Search, ExternalLink, X } from 'lucide-react';
import { getGlobalVoteStats, getUserVotes, triggerIntelCrawler, voteIntelTruth, getLastCrawlTime, getIntelCredibility } from '../services/intelService';
import hazardZonesData from '../data/hazard_zones.json';
import missileZonesData from '../data/missile_zones.json';
import coastalZonesData from '../data/coastal_zones.json';
import highRiskData from '../data/high_risk.json';

export default function IntelCrawlerModal({ isOpen, onClose }) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'verified' | 'disputed' | 'fake'
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(() => getGlobalVoteStats());
  const [userVotes, setUserVotes] = useState(() => getUserVotes());
  const [lastCrawl, setLastCrawl] = useState(() => getLastCrawlTime());
  const [crawlerCooldown, setCrawlerCooldown] = useState(0);
  const [crawlerLoading, setCrawlerLoading] = useState(false);
  const [crawlerFeedback, setCrawlerFeedback] = useState('');

  // 整理所有全域情報列表
  const allIntelList = React.useMemo(() => {
    const list = [];
    hazardZonesData.forEach(h => list.push({ ...h, category: '災變/停水電/封鎖', intelId: h.id }));
    missileZonesData.forEach(m => list.push({ ...m, category: '飛彈空襲熱區', intelId: m.id }));
    coastalZonesData.forEach(c => list.push({ ...c, category: '紅色海灘/登陸警戒', intelId: c.id }));
    highRiskData.forEach(hr => list.push({ ...hr, category: '關鍵基礎設施', intelId: hr.id }));
    return list;
  }, []);

  // 10 分鐘爬蟲倒數計時器
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastCrawl;
      const cooldownMs = 10 * 60 * 1000;
      if (elapsed < cooldownMs) {
        setCrawlerCooldown(Math.ceil((cooldownMs - elapsed) / 1000));
      } else {
        setCrawlerCooldown(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, lastCrawl]);

  // 監聽跨視窗 BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel('taiwan_sos_intel_channel');
    bc.onmessage = (ev) => {
      if (ev.data?.type === 'CRAWLER_UPDATE') {
        setStats(ev.data.stats);
        setLastCrawl(ev.data.timestamp);
      } else if (ev.data?.type === 'VOTE_UPDATE') {
        setStats(getGlobalVoteStats());
      }
    };
    return () => bc.close();
  }, []);

  if (!isOpen) return null;

  // 執行手動爬蟲更新
  const handleTriggerCrawler = async () => {
    setCrawlerLoading(true);
    setCrawlerFeedback('');
    const res = await triggerIntelCrawler();
    setCrawlerLoading(false);
    if (res.success) {
      setLastCrawl(res.timestamp);
      setStats(getGlobalVoteStats());
      setCrawlerFeedback(res.message);
    } else {
      setCrawlerFeedback(res.message);
    }
    setTimeout(() => setCrawlerFeedback(''), 5000);
  };

  // 投票真偽
  const handleVote = (intelId, choice) => {
    const res = voteIntelTruth(intelId, choice);
    setStats(getGlobalVoteStats());
    setUserVotes(getUserVotes());
    setCrawlerFeedback(res.message);
    setTimeout(() => setCrawlerFeedback(''), 4000);
  };

  // 篩選與搜尋過濾
  const filteredList = allIntelList.filter(item => {
    const cred = getIntelCredibility(item.intelId);
    if (filterType === 'verified' && cred.status !== 'verified') return false;
    if (filterType === 'disputed' && cred.status !== 'disputed') return false;
    if (filterType === 'fake' && cred.status !== 'fake') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q) || item.name?.toLowerCase().includes(q);
      const matchCity = item.city?.toLowerCase().includes(q) || item.district?.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchCity && !matchCat) return false;
    }
    return true;
  });

  const formatTime = (ts) => {
    if (!ts) return '剛才';
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[2600] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-cyan-500/80 rounded-2xl max-w-2xl w-full text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* 頂部 Header */}
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-600 rounded-xl shadow">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-cyan-300 flex items-center gap-1.5">
                🛰️ 災害敵情爬蟲引擎與情報真偽查證
              </h2>
              <p className="text-[11px] text-slate-400">
                每 10 分鐘抓取國防部 / NCDR / 台電 / 台水官方數據，支援群眾 1 人 1 票即時真偽審核（3分鐘內可修改）
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-full bg-slate-800 border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 爬蟲狀態控制台 Bar */}
        <div className="bg-slate-950/90 border-b border-cyan-900/40 p-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              爬蟲引擎在線
            </span>
            <span className="text-slate-400 text-[11px]">
              前次爬取：<b className="text-amber-300">{formatTime(lastCrawl)}</b>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerCrawler}
              disabled={crawlerCooldown > 0 || crawlerLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow ${
                crawlerCooldown > 0 || crawlerLoading
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border border-cyan-400 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${crawlerLoading ? 'animate-spin' : ''}`} />
              <span>
                {crawlerLoading
                  ? '爬取資料中...'
                  : crawlerCooldown > 0
                  ? `冷卻中 (${Math.floor(crawlerCooldown / 60)}分${crawlerCooldown % 60}秒)`
                  : '🔄 手動爬取最新情報'}
              </span>
            </button>
          </div>
        </div>

        {crawlerFeedback && (
          <div className="bg-cyan-950/90 border-b border-cyan-700 px-3 py-1.5 text-xs text-cyan-200 font-bold text-center animate-fadeIn shrink-0">
            {crawlerFeedback}
          </div>
        )}

        {/* 篩選器與搜尋 */}
        <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-1 rounded-lg transition-all ${
                filterType === 'all' ? 'bg-cyan-600 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
              }`}
            >
              全部情報 ({allIntelList.length})
            </button>
            <button
              onClick={() => setFilterType('verified')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                filterType === 'verified' ? 'bg-emerald-600 text-white font-black' : 'bg-slate-800 text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" /> 高度可信
            </button>
            <button
              onClick={() => setFilterType('disputed')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                filterType === 'disputed' ? 'bg-amber-600 text-slate-950 font-black' : 'bg-slate-800 text-amber-400'
              }`}
            >
              <AlertTriangle className="w-3 h-3" /> 查證中
            </button>
            <button
              onClick={() => setFilterType('fake')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                filterType === 'fake' ? 'bg-rose-600 text-white font-black' : 'bg-slate-800 text-rose-400'
              }`}
            >
              <XCircle className="w-3 h-3" /> 疑似謠言
            </button>
          </div>

          <div className="relative flex-1 min-w-[150px] max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋情報名稱、區域..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
          </div>
        </div>

        {/* 情報列表與真假投票卡片 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredList.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              沒有符合條件的敵情或災害情報。
            </div>
          ) : (
            filteredList.map((item) => {
              const cred = getIntelCredibility(item.intelId);
              const hasVoted = Boolean(cred.myVote);

              return (
                <div
                  key={item.intelId}
                  className="bg-slate-950/80 border border-slate-800 hover:border-cyan-700/60 rounded-xl p-3 space-y-2 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${cred.badgeColor}`}>
                          {cred.label} ({cred.truePercent}%)
                        </span>
                        <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
                          {item.category}
                        </span>
                        {item.city && (
                          <span className="text-[10px] text-slate-300 font-semibold bg-slate-800 px-1.5 py-0.5 rounded">
                            📍 {item.city} {item.district || ''}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white pt-0.5">
                        {item.title || item.name}
                      </h4>
                      <p className="text-[11px] text-slate-300 line-clamp-2">
                        {item.description || item.reason || item.warningMsg || '官方緊急應變通報情資'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">
                        來源：{cred.source}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        更新：{formatTime(cred.lastUpdated)}
                      </span>
                    </div>
                  </div>

                  {/* 可信度進度條 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>👍 真實認證: <b className="text-emerald-400">{cred.trueVotes}</b></span>
                      <span>👎 舉報造假: <b className="text-rose-400">{cred.fakeVotes}</b></span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${cred.truePercent}%` }}
                      />
                      <div
                        className="bg-rose-500 h-full transition-all duration-500"
                        style={{ width: `${100 - cred.truePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 投票與 3 分鐘修改按鈕列 */}
                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-800/80">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      {hasVoted ? (
                        cred.isLocked ? (
                          <span className="text-slate-400 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-400" />
                            判定已鎖定 ({cred.myVote === 'true' ? '您判定為真' : '您判定為假'})
                          </span>
                        ) : (
                          <span className="text-amber-300 font-bold flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" />
                            剩餘 {cred.remainingEditSeconds} 秒內可修改判定 ({cred.myVote === 'true' ? '當前判定：真' : '當前判定：假'})
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">尚未投票 (每人限 1 票，3分鐘內可修改)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleVote(item.intelId, 'true')}
                        disabled={cred.isLocked}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                          cred.myVote === 'true'
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow'
                            : cred.isLocked
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-emerald-950 text-emerald-400 border border-emerald-700/60 active:scale-95'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>判定真實</span>
                      </button>

                      <button
                        onClick={() => handleVote(item.intelId, 'fake')}
                        disabled={cred.isLocked}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                          cred.myVote === 'fake'
                            ? 'bg-rose-600 text-white ring-2 ring-rose-300 shadow'
                            : cred.isLocked
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-rose-950 text-rose-400 border border-rose-700/60 active:scale-95'
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                        <span>判定造假</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0 text-xs">
          <span className="text-slate-400 text-[11px]">
            🛡️ 群眾審查機制：低於 40% 真實度將標記「疑似假情報」警示
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-slate-200"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
}
