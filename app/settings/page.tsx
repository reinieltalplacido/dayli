"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Clock, User, ArrowLeft, Check } from "lucide-react";
import { getUserSettingsAction, updateUserSettingsAction } from "@/app/actions/settings";

export default function SettingsPage() {
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:30");
  const [bufferTime, setBufferTime] = useState("15");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const res = await getUserSettingsAction();
      if (res.success && res.settings) {
        if (res.settings.workStart) setWorkStart(res.settings.workStart);
        if (res.settings.workEnd) setWorkEnd(res.settings.workEnd);
        if (res.settings.bufferMinutes) setBufferTime(String(res.settings.bufferMinutes));
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserSettingsAction({
      workStart,
      workEnd,
      bufferMinutes: parseInt(bufferTime, 10),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell>
      <div className="max-w-2xl space-y-8">
        <div className="pb-6 border-b border-[#E4E8F0]">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#697386] mb-2">
            <span>Preferences</span>
            <span>•</span>
            <span className="text-[#3457D5] font-semibold bg-[#E8EDFF] px-2 py-0.5 rounded-md">Account & Planning</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-normal text-[#202536]">
            Settings & Working Hours
          </h1>
          <p className="mt-2 text-sm text-[#697386]">
            Configure your core focus window, scheduling boundaries, and account preferences.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Working Hours Section */}
          <div className="p-6 rounded-xl border border-[#E4E8F0] bg-white shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E4E8F0]">
              <Clock className="w-4 h-4 text-[#3457D5]" />
              <h2 className="font-editorial text-xl text-[#202536]">
                Daily Scheduling Constraints
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#697386] mb-1.5">
                  Day Starts At
                </label>
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D3D8E2] bg-[#F7F8FC] text-xs font-mono text-[#202536] focus:border-[#3457D5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#697386] mb-1.5">
                  Day Ends At
                </label>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D3D8E2] bg-[#F7F8FC] text-xs font-mono text-[#202536] focus:border-[#3457D5] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#697386] mb-1.5">
                Default Focus Buffer Between Tasks
              </label>
              <select
                value={bufferTime}
                onChange={(e) => setBufferTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D3D8E2] bg-[#F7F8FC] text-xs text-[#202536] focus:border-[#3457D5] focus:outline-none"
              >
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes (Recommended)</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="p-6 rounded-xl border border-[#E4E8F0] bg-white shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E4E8F0]">
              <User className="w-4 h-4 text-[#3457D5]" />
              <h2 className="font-editorial text-xl text-[#202536]">
                User Profile
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-[#697386]">Name</span>
                <span className="font-medium text-[#202536]">Alex Mercer</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#697386]">Account Mode</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#E8EDFF] text-[#3457D5]">
                  Local Planner Preview
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#697386] hover:text-[#202536]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to My Day
            </Link>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#3457D5] hover:bg-[#263C9A] text-white text-xs font-medium transition-colors shadow-2xs"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Preferences Saved</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
