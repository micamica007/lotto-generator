import React from 'react';
import { getBallColorInfo } from '../utils/lottoGenerator';

export default function LottoBall({
  number,
  size = 'md',
  isBonus = false,
  badge = null,
  className = '',
  onClick = null,
  selected = false,
  dimmed = false,
  style = {}
}) {
  const color = getBallColorInfo(number);

  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-8 h-8 text-xs font-semibold',
    md: 'w-10 h-10 text-sm font-bold',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-14 h-14 text-lg font-extrabold'
  };

  const ballSize = sizeClasses[size] || sizeClasses.md;

  // 3D 구체 느낌의 그라디언트
  const sphereStyle = {
    backgroundColor: color.bg,
    backgroundImage: `radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.1) 40%, rgba(0, 0, 0, 0.25) 100%)`,
    color: '#ffffff',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
    borderColor: color.border,
    ...style
  };

  return (
    <div className="relative inline-flex flex-col items-center" data-ball-container={number}>
      <div
        data-ball={number}
        onClick={onClick}
        style={sphereStyle}
        className={`
          ${ballSize}
          rounded-full flex items-center justify-center
          border shadow-md select-none transition-transform
          ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}
          ${selected ? 'ring-4 ring-indigo-500 ring-offset-2' : ''}
          ${dimmed ? 'opacity-40 grayscale' : 'opacity-100'}
          ${className}
        `}
      >
        <span>{String(number).padStart(2, '0')}</span>
      </div>

      {badge && (
        <span className="absolute -bottom-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-white shadow">
          {badge}
        </span>
      )}
    </div>
  );
}
