'use client';

import React from 'react';
import Image from 'next/image';

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
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-[7px] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src="/dayli_logo.png"
        alt="Dayli Logo"
        width={size}
        height={size}
        className="w-full h-full object-contain"
        priority={priority}
      />
    </div>
  );
};
