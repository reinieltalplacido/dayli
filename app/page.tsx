'use client';

import dynamic from 'next/dynamic';

function DayliLoadingFallback() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-[#121214]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#38383A] shadow-xs flex items-center justify-center animate-pulse">
          <span className="w-4 h-4 rounded-full bg-[#0A84FF]" />
        </div>
        <p className="text-xs font-medium text-[#86868B] dark:text-[#98989D] tracking-tight">
          Loading Dayli...
        </p>
      </div>
    </div>
  );
}

const DayliCalendarApp = dynamic(
  () => import('@/components/DayliCalendarApp').then((mod) => mod.DayliCalendarApp),
  {
    ssr: false,
    loading: () => <DayliLoadingFallback />,
  }
);

export default function Page() {
  return <DayliCalendarApp />;
}
