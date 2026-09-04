import React, { useState } from 'react';
import { Pin, Ban, RotateCcw, Check, Info, Sparkles } from 'lucide-react';
import LottoBall from './LottoBall';

export default function NumberSelector({
  fixedNumbers,
  setFixedNumbers,
  excludedNumbers,
  setExcludedNumbers
}) {
  // 현재 선택 모드: 'fixed' (고정 번호) 또는 'excluded' (제외 번호)
  const [activeMode, setActiveMode] = useState('fixed');

  const MAX_FIXED = 5;
  const MAX_EXCLUDED = 10;

  // 번호 클릭 토글 핸들러
  const handleNumberClick = (num) => {
    if (activeMode === 'fixed') {
      setFixedNumbers(prevFixed => {
        if (prevFixed.includes(num)) {
          return prevFixed.filter(n => n !== num);
        }
        if (prevFixed.length >= MAX_FIXED) {
          alert(`고정 번호는 최대 ${MAX_FIXED}개까지만 설정할 수 있습니다.`);
          return prevFixed;
        }
        // 제외 번호에서 자동 제거
        setExcludedNumbers(prevExcluded => prevExcluded.filter(n => n !== num));
        return [...prevFixed, num].sort((a, b) => a - b);
      });
    } else {
      // excluded 모드
      setExcludedNumbers(prevExcluded => {
        if (prevExcluded.includes(num)) {
          return prevExcluded.filter(n => n !== num);
        }
        if (prevExcluded.length >= MAX_EXCLUDED) {
          alert(`제외 번호는 최대 ${MAX_EXCLUDED}개까지만 설정할 수 있습니다.`);
          return prevExcluded;
        }
        // 고정 번호에서 자동 제거
        setFixedNumbers(prevFixed => prevFixed.filter(n => n !== num));
        return [...prevExcluded, num].sort((a, b) => a - b);
      });
    }
  };

  const clearFixed = () => setFixedNumbers([]);
  const clearExcluded = () => setExcludedNumbers([]);
  const clearAll = () => {
    setFixedNumbers([]);
    setExcludedNumbers([]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      {/* 상단 타이틀 및 모드 전환 탭 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            고정수 / 제외수 맞춤 설정
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            원하는 모드를 선택한 후 1~45 번호판을 클릭하세요.
          </p>
        </div>

        {/* 모드 전환 탭 버튼 */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            data-tab="fixed"
            onClick={() => setActiveMode('fixed')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'fixed'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            고정 번호 ({fixedNumbers.length}/{MAX_FIXED})
          </button>
          <button
            type="button"
            data-tab="excluded"
            onClick={() => setActiveMode('excluded')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'excluded'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            제외 번호 ({excludedNumbers.length}/{MAX_EXCLUDED})
          </button>
        </div>
      </div>

      {/* 현재 선택된 번호 칩 요약 바 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
        {/* 고정 번호 목록 */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
              고정 번호 (모든 게임에 반드시 포함)
            </span>
            {fixedNumbers.length > 0 && (
              <button
                onClick={clearFixed}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium underline"
              >
                비우기
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 min-h-[36px]">
            {fixedNumbers.length === 0 ? (
              <span className="text-xs text-slate-400">설정된 고정 번호가 없습니다.</span>
            ) : (
              fixedNumbers.map(num => (
                <div
                  key={`fix-${num}`}
                  onClick={() => handleNumberClick(num)}
                  className="cursor-pointer group flex items-center gap-1 bg-white border border-blue-300 px-2 py-0.5 rounded-full shadow-xs hover:border-rose-400 transition-colors"
                  title="클릭하여 해제"
                >
                  <span className="text-xs font-bold text-blue-700">{num}</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-rose-500">✕</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 제외 번호 목록 */}
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              제외 번호 (추첨 풀에서 완전히 배제)
            </span>
            {excludedNumbers.length > 0 && (
              <button
                onClick={clearExcluded}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-medium underline"
              >
                비우기
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 min-h-[36px]">
            {excludedNumbers.length === 0 ? (
              <span className="text-xs text-slate-400">설정된 제외 번호가 없습니다.</span>
            ) : (
              excludedNumbers.map(num => (
                <div
                  key={`exc-${num}`}
                  onClick={() => handleNumberClick(num)}
                  className="cursor-pointer group flex items-center gap-1 bg-white border border-rose-300 px-2 py-0.5 rounded-full shadow-xs hover:border-slate-400 transition-colors"
                  title="클릭하여 해제"
                >
                  <span className="text-xs font-bold text-rose-700">{num}</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-rose-500">✕</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 1~45 번호 선택 그리드 */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">번호판 (1~45)</span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span> 고정됨
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500"></span> 제외됨
            </span>
          </div>
          {(fixedNumbers.length > 0 || excludedNumbers.length > 0) && (
            <button
              onClick={clearAll}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> 전체 초기화
            </button>
          )}
        </div>

        <div className="grid grid-cols-9 sm:grid-cols-15 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
          {Array.from({ length: 45 }, (_, i) => i + 1).map(num => {
            const isFixed = fixedNumbers.includes(num);
            const isExcluded = excludedNumbers.includes(num);

            return (
              <div key={num} className="relative flex justify-center items-center">
                <LottoBall
                  number={num}
                  size="sm"
                  onClick={() => handleNumberClick(num)}
                  dimmed={isExcluded}
                  className={`
                    transition-all
                    ${isFixed ? 'ring-2 ring-blue-600 scale-105 shadow-md' : ''}
                    ${isExcluded ? 'line-through decoration-rose-600 decoration-2 ring-2 ring-rose-400' : ''}
                  `}
                />
                {isFixed && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 shadow">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
                {isExcluded && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow">
                    <Ban className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 로또 공 색상 범례 가이드 */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <span className="font-semibold text-slate-600">공 색상 기준:</span>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FBC400] inline-block"></span> 1~10 (노랑)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#69C8F2] inline-block"></span> 11~20 (파랑)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF7272] inline-block"></span> 21~30 (빨강)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#AAAAAA] inline-block"></span> 31~40 (회색)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B0D840] inline-block"></span> 41~45 (초록)
          </span>
        </div>
      </div>
    </div>
  );
}
