"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { CheckSquare2, ArrowLeft } from "lucide-react";

export default function TasksPage() {
  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <div className="pb-6 border-b border-[#E4E8F0]">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#697386] mb-2">
            <span>Planner</span>
            <span>•</span>
            <span className="text-[#3457D5] font-semibold bg-[#E8EDFF] px-2 py-0.5 rounded-md">Master Backlog</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-normal text-[#202536]">
            All Tasks & Backlog
          </h1>
          <p className="mt-2 text-sm text-[#697386]">
            Central backlog of unscheduled items, projects, and long-term goals.
          </p>
        </div>

        <div className="p-8 rounded-xl border border-dashed border-[#D3D8E2] bg-white text-center space-y-3 shadow-2xs">
          <CheckSquare2 className="w-10 h-10 text-[#3457D5] mx-auto opacity-80" />
          <h2 className="font-editorial text-2xl text-[#202536]">
            Global Task Repository
          </h2>
          <p className="text-xs text-[#697386] max-w-md mx-auto leading-relaxed">
            The master backlog repository will allow pulling unscheduled backlog tasks into your daily schedule when you have available capacity.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3457D5] text-white text-xs font-medium hover:bg-[#263C9A] transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to My Day
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
