import React, { useState } from 'react';
import { Copy, Check, Dice5, Sparkles, RefreshCw } from 'lucide-react';
import LottoBall from './LottoBall';
import { formatGamesForClipboard } from '../utils/lottoGenerator';

export default function GameResults({
  games,
  onGenerate,
  generating,
  fixedNumbers = [],
  excludedNumbers = []
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    if (!games || games.length === 0) return;
    const text = formatGamesForClipboard(games);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for clipboard
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      {/* 상단 액션 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Dice5 className="w-5 h-5 text-indigo-600" />
            가중치 기반 5게임 자동 추출 결과
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            출현 빈도 가중치가 반영된 6개 숫자 조합 (오름차순 정렬)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {games && games.length > 0 && (
            <button
              onClick={handleCopyAll}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  5게임 전체 복사 완료!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  5게임 전체 복사
                </>
              )}
            </button>
          )}

          <button
            data-action="generate-games"
            onClick={onGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {generating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>5게임 번호 생성</span>
          </button>
        </div>
      </div>

      {/* 5게임 카드 목록 */}
      <div className="mt-4 space-y-3">
        {(!games || games.length === 0) ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Dice5 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">아직 생성된 게임이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">
              상단의 "5게임 번호 생성" 버튼을 눌러 가중치 추첨을 시작하세요.
            </p>
          </div>
        ) : (
          games.map((game, idx) => (
            <div
              key={game.label}
              data-game={game.label}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-150 bg-gradient-to-r from-slate-50/70 to-white hover:border-indigo-200 hover:shadow-sm transition-all gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                  {game.label}
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {game.label}게임 (자동)
                </span>
              </div>

              {/* 번호 6개 공 */}
              <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-2.5 flex-wrap">
                {game.numbers.map((num) => {
                  const isFixed = fixedNumbers.includes(num);
                  return (
                    <div key={`${game.label}-${num}`} className="relative">
                      <LottoBall number={num} size="md" />
                      {isFixed && (
                        <span className="absolute -top-1.5 -right-1 text-[9px] font-bold px-1 rounded-full bg-blue-600 text-white shadow">
                          고정
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 안내 메시지 */}
      {(fixedNumbers.length > 0 || excludedNumbers.length > 0) && (
        <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <span>
            💡 현재 적용 설정:
            {fixedNumbers.length > 0 && ` 고정번호 [${fixedNumbers.join(', ')}]`}
            {fixedNumbers.length > 0 && excludedNumbers.length > 0 && ' / '}
            {excludedNumbers.length > 0 && ` 제외번호 [${excludedNumbers.join(', ')}]`}
          </span>
        </div>
      )}
    </div>
  );
}
