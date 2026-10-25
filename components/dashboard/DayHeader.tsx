"use client";

import React, { useMemo } from "react";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { Task } from "@/types/planner";
import { useCurrentTimestamp } from "@/hooks/useCurrentTime";

interface DayHeaderProps {
  tasks: Task[];
  onOpenAddTask: () => void;
}

export function DayHeader({ tasks, onOpenAddTask }: DayHeaderProps) {
  const timestamp = useCurrentTimestamp();

  // Time-aware greeting & date based on current timestamp
  const { dateFormatted, greeting } = useMemo(() => {
    const now = new Date(timestamp);
    const hour = now.getHours();
    let greet = "Good morning";
    if (hour >= 12 && hour < 17) greet = "Good afternoon";
    else if (hour >= 17) greet = "Good evening";

    return {
      greeting: greet,
      dateFormatted: {
        weekday: now.toLocaleDateString("en-US", { weekday: "long" }),
        month: now.toLocaleDateString("en-US", { month: "long" }),
        day: now.getDate(),
      },
    };
  }, [timestamp]);

  // Summary statistics
  const summary = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const remaining = total - completed;

    const remainingMinutes = tasks
      .filter((t) => !t.completed)
      .reduce((sum, t) => sum + (t.durationMinutes || 0), 0);

    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    const timeFormatted =
      hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;

    return { total, completed, remaining, timeFormatted };
  }, [tasks]);

  return (
    <header className="pb-8 border-b border-[#E4E8F0]">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          {/* Editorial date eyebrow & status */}
          <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-[#697386] mb-2.5">
            <span className="flex items-center gap-1.5 text-[#3457D5] font-semibold bg-[#E8EDFF] px-2.5 py-0.5 rounded-md">
              <CalendarIcon className="w-3 h-3" />
              Today
            </span>
            <span>•</span>
            <span>{dateFormatted.month} {dateFormatted.day}</span>
          </div>

          {/* Prominent Editorial Date Heading */}
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#202536] leading-none">
            {dateFormatted.weekday}
          </h1>

          {/* Greeting & concise daily summary */}
          <p className="mt-3 text-base text-[#697386] flex flex-wrap items-center gap-x-2">
            <span className="text-[#202536] font-medium">{greeting}, Alex.</span>
            <span>
              {summary.remaining === 0 && summary.total > 0
                ? "All set for today — everything planned has been finished."
                : summary.total === 0
                ? "Your slate is clean for today. Take time to map your key priorities."
                : `You have ${summary.remaining} ${
                    summary.remaining === 1 ? "task" : "tasks"
                  } remaining (${summary.timeFormatted} planned focus time).`}
            </span>
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddTask}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#3457D5] hover:bg-[#263C9A] text-white text-sm font-medium transition-all shadow-2xs hover:shadow-xs focus-visible:ring-2 focus-visible:ring-[#3457D5] focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span>Add Task</span>
          </button>
        </div>
      </div>
    </header>
  );
}
