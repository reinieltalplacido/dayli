'use client';

import React from 'react';

interface DayliLogoProps {
  size?: number;
  className?: string;
  dayNumber?: number;
}

export const DayliLogo: React.FC<DayliLogoProps> = ({
  size = 28,
  className = '',
  dayNumber,
}) => {
  const displayDay = dayNumber !== undefined ? dayNumber : 29;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-[7px] overflow-hidden shadow-sm border border-[#E5E5EA] bg-white ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Top red header bar characteristic of classic desktop calendar app icons */}
      <div className="absolute top-0 left-0 right-0 h-[30%] bg-[#FF3B30] flex items-center justify-center">
        <div className="w-1.5 h-0.5 rounded-full bg-white/70" />
      </div>
      {/* Main date glyph */}
      <div className="absolute bottom-0 left-0 right-0 h-[70%] flex items-center justify-center bg-white">
        <span className="text-[11px] font-bold text-[#1D1D1F] tracking-tighter leading-none">
          {displayDay}
        </span>
      </div>
    </div>
  );
};
