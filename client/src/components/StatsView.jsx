import React, { useState } from 'react';
import { Flame, Snowflake, BarChart3, TrendingUp, HelpCircle } from 'lucide-react';
import LottoBall from './LottoBall';
import { getBallColorInfo } from '../utils/lottoGenerator';

export default function StatsView({
  stats,
  loading,
  selectedCount,
  onSelectCount
}) {
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'heatmap'

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex items-center justify-center min-h-[260px]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-700">최근 당첨 통계 데이터를 분석 중입니다...</p>
          <p className="text-xs text-slate-400 mt-1">최근 {selectedCount}회차 당첨 번호를 집계하고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const frequency = stats.frequency || {};
  const maxCount = Math.max(...Object.values(frequency), 1);
  const hotNumbers = stats.hotNumbers || [];
  const coldNumbers = stats.coldNumbers || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-6">
      {/* 통계 헤더 & 회차 선택 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            최근 출현 빈도 통계 분석 (Hot & Cold)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            제 {stats.startRound}회 ~ 제 {stats.endRound}회 ({stats.analyzedCount}회차 분석 데이터)
          </p>
        </div>

        {/* 회차 범위 선택 버튼 (20, 30, 50회) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[20, 30, 50].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onSelectCount(count)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCount === count
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 disabled:opacity-50'
              }`}
            >
              최근 {count}회
            </button>
          ))}
        </div>
      </div>

      {/* Hot & Cold 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hot Numbers (다출수) */}
        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              HOT 다출현 번호 TOP 5 (가중치 우대)
            </span>
            <span className="text-[11px] text-rose-600 font-medium">최다 당첨</span>
          </div>
          <div className="flex items-center justify-around gap-2 flex-wrap">
            {hotNumbers.slice(0, 5).map((item) => (
              <div key={`hot-${item.number}`} className="flex flex-col items-center gap-1">
                <LottoBall number={item.number} size="md" />
                <span className="text-[11px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-full border border-rose-200 shadow-2xs">
                  {item.count}회 ({((item.count / stats.analyzedCount) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cold Numbers (과소출수) */}
        <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
              <Snowflake className="w-4 h-4 text-sky-500" />
              COLD 과소출현 번호 TOP 5
            </span>
            <span className="text-[11px] text-sky-600 font-medium">최저 당첨</span>
          </div>
          <div className="flex items-center justify-around gap-2 flex-wrap">
            {coldNumbers.slice(0, 5).map((item) => (
              <div key={`cold-${item.number}`} className="flex flex-col items-center gap-1">
                <LottoBall number={item.number} size="md" />
                <span className="text-[11px] font-bold text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-200 shadow-2xs">
                  {item.count}회 ({((item.count / stats.analyzedCount) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 1~45 번호별 출현 빈도 막대 차트 / 히트맵 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            1~45 전체 번호별 출현 빈도수 분포
          </span>
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                viewMode === 'chart'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              막대 그래프
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                viewMode === 'heatmap'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              히트맵
            </button>
          </div>
        </div>

        {viewMode === 'chart' ? (
          /* 막대 그래프 뷰 */
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
            <div className="min-w-[700px] h-48 flex items-end justify-between gap-1 pt-6 pb-2">
              {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
                const count = frequency[num] || 0;
                const heightPercent = Math.max((count / maxCount) * 100, 4);
                const ballColor = getBallColorInfo(num);

                return (
                  <div
                    key={`bar-${num}`}
                    className="flex-1 flex flex-col items-center justify-end group relative h-full"
                  >
                    {/* 툴팁 */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10 shadow">
                      {num}번: {count}회
                    </div>

                    {/* 막대 */}
                    <div
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: ballColor.bg
                      }}
                      className="w-full rounded-t-sm transition-all group-hover:brightness-90 shadow-2xs"
                    ></div>

                    {/* 하단 번호 라벨 */}
                    <span className="text-[9px] font-bold text-slate-500 mt-1 select-none">
                      {num}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 히트맵 뷰 */
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
              const count = frequency[num] || 0;
              const intensity = count / maxCount; // 0 ~ 1

              return (
                <div
                  key={`heat-${num}`}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <LottoBall number={num} size="xs" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-700 leading-none">
                      {count}회
                    </span>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${intensity * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 가중치 알고리즘 설명 가이드 */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">가중치(Weight) 계산 원리:</span>
          <p className="mt-0.5 text-slate-600 leading-relaxed">
            각 번호의 가중치는 <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 font-semibold font-mono">Weight(n) = 최근 출현 횟수 + 기본 가중치(1)</code>로 산출됩니다.
            따라서 최근 당첨 빈도가 높았던 번호는 더 자주 뽑힐 확률을 가지며, 아직 출현하지 않은 번호도 기본 가중치(1)를 통해 조합에 포함될 기회를 보장받습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
