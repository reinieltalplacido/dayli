"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, Plus } from "lucide-react";
import { Sidebar } from "@/components/navigation/Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  onOpenAddTask?: () => void;
}

export function AppShell({ children, onOpenAddTask }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F7F8FC] text-[#202536]">
      {/* Sidebar navigation */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#E4E8F0] bg-white/90 backdrop-blur-sm sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="p-1.5 rounded-lg text-[#697386] hover:text-[#202536] hover:bg-[#F0F3F9] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-baseline gap-1 focus-visible:outline-none">
            <span className="font-editorial text-xl font-normal tracking-tight text-[#202536]">
              dayli
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3457D5] mb-0.5" />
          </Link>

          {onOpenAddTask ? (
            <button
              onClick={onOpenAddTask}
              aria-label="Add task"
              className="p-1.5 rounded-lg bg-[#3457D5] text-white hover:bg-[#263C9A] transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <div className="w-8" />
          )}
        </header>

        {/* Page Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
