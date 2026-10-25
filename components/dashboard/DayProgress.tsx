"use client";

import React, { useMemo } from "react";
import { ListChecks } from "lucide-react";
import { Task } from "@/types/planner";

interface DayProgressProps {
  tasks: Task[];
}

export function DayProgress({ tasks }: DayProgressProps) {
  const stats = useMemo(() => {
    const total = tasks.length;
    if (total === 0) {
      return {
        total: 0,
        completed: 0,
        remaining: 0,
        percent: 0,
        totalMinutes: 0,
        completedMinutes: 0,
        remainingMinutes: 0,
      };
    }

    const completed = tasks.filter((t) => t.completed).length;
    const remaining = total - completed;
    const percent = Math.round((completed / total) * 100);

    const totalMinutes = tasks.reduce(
      (sum, t) => sum + (t.durationMinutes || 0),
      0
    );
    const completedMinutes = tasks
      .filter((t) => t.completed)
      .reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
    const remainingMinutes = totalMinutes - completedMinutes;

    return {
      total,
      completed,
      remaining,
      percent,
      totalMinutes,
      completedMinutes,
      remainingMinutes,
    };
  }, [tasks]);

  const formatMins = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  if (stats.total === 0) return null;

  return (
    <div className="py-5 px-6 rounded-xl bg-white border border-[#E4E8F0] my-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E8EDFF] flex items-center justify-center text-[#3457D5]">
            <ListChecks className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-editorial text-lg font-medium text-[#202536]">
                Daily Trajectory
              </span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-md font-medium ${
                stats.percent === 100 
                  ? "bg-[#E5F5EC] text-[#247A52]" 
                  : "bg-[#F0F3F9] text-[#697386]"
              }`}>
                {stats.percent}% Finished
              </span>
            </div>
            <p className="text-xs text-[#697386]">
              {stats.completed} of {stats.total} tasks completed
            </p>
          </div>
        </div>

        {/* Detailed time readout */}
        <div className="flex items-center gap-5 text-xs font-mono text-[#697386]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3457D5]" />
            <span>Invested: {formatMins(stats.completedMinutes)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D3D8E2]" />
            <span>Remaining: {formatMins(stats.remainingMinutes)}</span>
          </div>
        </div>
      </div>

      {/* Segmented Progress Track */}
      <div className="flex gap-1.5 w-full pt-1">
        {tasks.map((task, idx) => (
          <div
            key={task.id || idx}
            title={`${task.title} (${task.completed ? "Done" : "Pending"})`}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              task.completed
                ? "bg-[#3457D5]"
                : "bg-[#E4E8F0] hover:bg-[#D3D8E2]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
