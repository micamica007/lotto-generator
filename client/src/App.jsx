import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Dices, Layers, BarChart, ShieldCheck, AlertCircle } from 'lucide-react';
import LatestDraw from './components/LatestDraw';
import NumberSelector from './components/NumberSelector';
import GameResults from './components/GameResults';
import StatsView from './components/StatsView';
import { generateFiveGames } from './utils/lottoGenerator';

export default function App() {
  const [latestDraw, setLatestDraw] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsCount, setStatsCount] = useState(30); // 20, 30, 50

  // 고정수 및 제외수 상태
  const [fixedNumbers, setFixedNumbers] = useState([]);
  const [excludedNumbers, setExcludedNumbers] = useState([]);

  // 생성된 5게임 조합
  const [games, setGames] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // 최신 회차 당첨 번호 불러오기
  const fetchLatest = async () => {
    setLoadingLatest(true);
    try {
      const res = await fetch('/api/lotto/latest');
      if (!res.ok) throw new Error('최신 회차 정보를 가져올 수 없습니다.');
      const data = await res.json();
      setLatestDraw(data);
    } catch (err) {
      console.error('Failed to load latest draw:', err);
    } finally {
      setLoadingLatest(false);
    }
  };

  // 최근 회차 통계 데이터 불러오기
  const fetchStats = useCallback(async (count) => {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/lotto/stats?count=${count}`);
      if (!res.ok) throw new Error('통계 데이터를 가져올 수 없습니다.');
      const data = await res.json();
      setStats(data);
      return data;
    } catch (err) {
      console.error('Failed to load stats:', err);
      return null;
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // 5게임 자동 생성 핸들러
  const handleGenerateGames = useCallback((currentStats = stats) => {
    setGenerating(true);
    setErrorMsg(null);

    try {
      const freq = currentStats?.frequency || {};
      const newGames = generateFiveGames(freq, fixedNumbers, excludedNumbers);
      setGames(newGames);
    } catch (err) {
      setErrorMsg(err.message || '게임 번호 생성 중 오류가 발생했습니다.');
    } finally {
      setTimeout(() => setGenerating(false), 200);
    }
  }, [stats, fixedNumbers, excludedNumbers]);

  // 초기 데이터 로딩
  useEffect(() => {
    const init = async () => {
      await fetchLatest();
      const loadedStats = await fetchStats(30);
      if (loadedStats) {
        handleGenerateGames(loadedStats);
      }
    };
    init();
  }, [fetchStats]);

  // 통계 회차 변경 시 재조회
  const handleSelectStatsCount = async (count) => {
    setStatsCount(count);
    await fetchStats(count);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 pb-16">
      {/* 글로벌 상단 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-md font-black text-xl">
              6/45
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                로또 6/45 통계 기반 가중치 5게임 추출기
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                동행복권 최신 당첨 데이터 연동 · Hot/Cold 번호 가중치 랜덤 추첨
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span>동행복권 공식 API 연동</span>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 컨테이너 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* 오류 알림 배너 */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. 최신 회차 당첨 번호 배너 */}
        <LatestDraw
          latestDraw={latestDraw}
          loading={loadingLatest}
          onRefresh={fetchLatest}
        />

        {/* 2단 반응형 그리드: 번호 설정 및 추첨 결과 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 좌측: 고정수/제외수 설정 (5 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <NumberSelector
              fixedNumbers={fixedNumbers}
              setFixedNumbers={setFixedNumbers}
              excludedNumbers={excludedNumbers}
              setExcludedNumbers={setExcludedNumbers}
            />
          </div>

          {/* 우측: 5게임 추출 결과 (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <GameResults
              games={games}
              onGenerate={() => handleGenerateGames()}
              generating={generating}
              fixedNumbers={fixedNumbers}
              excludedNumbers={excludedNumbers}
            />
          </div>
        </div>

        {/* 3. 최근 회차 출현 빈도 통계 시각화 대시보드 */}
        <StatsView
          stats={stats}
          loading={loadingStats}
          selectedCount={statsCount}
          onSelectCount={handleSelectStatsCount}
        />
      </main>

      {/* 하단 푸터 */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 mt-12 text-center text-xs text-slate-400">
        <p>본 로또 번호 추출기는 동행복권의 과거 당첨 통계 데이터를 기반으로 한 가중치 무작위 시뮬레이션 도구입니다.</p>
        <p className="mt-1">복권 구매는 건전한 오락이며, 당첨을 보장하지 않습니다.</p>
      </footer>
    </div>
  );
}
