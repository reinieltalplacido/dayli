'use client';

import React from 'react';
import Image from 'next/image';
import dayliLogoImg from '@/public/dayli_logo.png';

interface DayliLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export const DayliLogo: React.FC<DayliLogoProps> = ({
  size = 28,
  className = '',
  priority = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src={dayliLogoImg}
        alt="Dayli Logo"
        width={size}
        height={size}
        className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
        priority={priority}
      />
    </div>
  );
};
