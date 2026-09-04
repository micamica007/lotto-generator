import React from 'react';
import { Trophy, Calendar, Plus, RefreshCw } from 'lucide-react';
import LottoBall from './LottoBall';

export default function LatestDraw({ latestDraw, loading, onRefresh }) {
  if (loading && !latestDraw) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-center min-h-[120px]">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span>최신 당첨 번호를 불러오는 중입니다...</span>
        </div>
      </div>
    );
  }

  if (!latestDraw) return null;

  const winningNumbers = [
    latestDraw.drwtNo1,
    latestDraw.drwtNo2,
    latestDraw.drwtNo3,
    latestDraw.drwtNo4,
    latestDraw.drwtNo5,
    latestDraw.drwtNo6
  ].filter(Boolean);

  const formattedPrize = latestDraw.firstWinamnt
    ? (latestDraw.firstWinamnt / 100000000).toFixed(1) + '억원'
    : null;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-md p-5 sm:p-6 relative overflow-hidden">
      {/* 장식용 배경 광원 */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">
                제 {latestDraw.drwNo}회 당첨결과
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950">
                공식 발표
              </span>
            </div>
            {latestDraw.drwNoDate && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                추첨일: {latestDraw.drwNoDate}
                {formattedPrize && (
                  <span className="ml-2 text-amber-300 font-medium">
                    (1등 당첨금: 약 {formattedPrize}, {latestDraw.firstPrzwnerCo}명)
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="self-start sm:self-auto text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:bg-slate-700/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 로또 공 배치 */}
      <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3">
        {winningNumbers.map((num, idx) => (
          <LottoBall key={`latest-${idx}-${num}`} number={num} size="lg" />
        ))}

        <div className="flex items-center justify-center text-slate-400 px-1">
          <Plus className="w-5 h-5" />
        </div>

        <div className="flex flex-col items-center">
          <LottoBall number={latestDraw.bnusNo} size="lg" isBonus={true} />
          <span className="text-[10px] text-amber-300 font-bold mt-1">보너스</span>
        </div>
      </div>
    </div>
  );
}
