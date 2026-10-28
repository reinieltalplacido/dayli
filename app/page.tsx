import { Suspense } from 'react';
import { DayliCalendarApp } from '@/components/DayliCalendarApp';

function DayliLoadingFallback() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#F5F5F7]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E5EA] shadow-xs flex items-center justify-center animate-pulse">
          <span className="w-4 h-4 rounded-full bg-[#0A84FF]" />
        </div>
        <p className="text-xs font-medium text-[#86868B] tracking-tight">
          Loading Dayli...
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<DayliLoadingFallback />}>
      <DayliCalendarApp />
    </Suspense>
  );
}
