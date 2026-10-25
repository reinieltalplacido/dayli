"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  SunMedium, 
  Calendar, 
  CalendarClock, 
  CheckSquare2, 
  Settings, 
  Sparkles,
  ChevronRight,
  X
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "My Day", href: "/", icon: SunMedium },
  { label: "Upcoming", href: "/upcoming", icon: CalendarClock },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Tasks", href: "/tasks", icon: CheckSquare2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  const navContent = (
    <div className="flex h-full flex-col justify-between p-5">
      {/* Brand & Wordmark */}
      <div>
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#E4E8F0]">
          <Link 
            href="/" 
            onClick={onCloseMobile}
            className="group flex items-baseline gap-1.5 focus-visible:outline-none"
          >
            <span className="font-editorial text-2xl font-normal tracking-tight text-[#202536] group-hover:text-[#3457D5] transition-colors">
              dayli
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3457D5] mb-0.5 group-hover:scale-125 transition-transform" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#697386] ml-1.5">
              v0.1
            </span>
          </Link>
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="md:hidden p-1.5 text-[#697386] hover:text-[#202536] rounded-md hover:bg-[#F0F3F9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav aria-label="Main Navigation" className="space-y-1">
          <p className="px-3 pb-2 text-[11px] font-mono uppercase tracking-wider text-[#697386]">
            Planner
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#3457D5] text-white shadow-2xs font-medium"
                    : "text-[#202536] hover:bg-[#F0F3F9] hover:text-[#3457D5]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-[#E8EDFF]" : "text-[#697386] group-hover:text-[#3457D5]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive
                        ? "bg-[#263C9A] text-[#E8EDFF]"
                        : "bg-[#E4E8F0] text-[#697386]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Subtle AI Assistant preview banner */}
        <div className="mt-8 p-3.5 rounded-xl border border-[#E4E8F0] bg-[#F7F8FC] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#3457D5]">
            <Sparkles className="w-3.5 h-3.5 text-[#3457D5]" />
            <span>AI Planning Preview</span>
          </div>
          <p className="text-xs text-[#697386] leading-relaxed">
            Automatic day balancing and schedule optimization will be anchored to your fixed commitments.
          </p>
        </div>
      </div>

      {/* User profile footer */}
      <div className="pt-4 border-t border-[#E4E8F0]">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F0F3F9] transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#3457D5] text-white font-editorial flex items-center justify-center text-sm font-medium flex-shrink-0">
              AM
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-[#202536] group-hover:text-[#3457D5] transition-colors truncate">
                Alex Mercer
              </p>
              <p className="text-[11px] font-mono text-[#697386] truncate">
                Focus Plan • Pro
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#697386] group-hover:text-[#202536] transition-colors flex-shrink-0" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#E4E8F0] bg-white flex-shrink-0 min-h-screen">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl md:hidden transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </div>
    </>
  );
}
