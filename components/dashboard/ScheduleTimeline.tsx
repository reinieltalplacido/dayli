"use client";

import React, { useMemo } from "react";
import { Clock, Check } from "lucide-react";
import { Task } from "@/types/planner";
import { useCurrentTimestamp } from "@/hooks/useCurrentTime";

interface ScheduleTimelineProps {
  tasks: Task[];
  onToggleComplete?: (id: string) => void;
  onOpenAddTaskWithTime?: (time: string) => void;
}

export function ScheduleTimeline({
  tasks,
  onToggleComplete,
}: ScheduleTimelineProps) {
  const timestamp = useCurrentTimestamp();

  // Filter tasks that have a scheduled time, sorted chronologically
  const scheduledTasks = useMemo(() => {
    return tasks
      .filter((t) => Boolean(t.scheduledTime))
      .sort((a, b) => (a.scheduledTime! > b.scheduledTime! ? 1 : -1));
  }, [tasks]);

  // Current time for the live time indicator
  const { currentHour, currentMinute, currentTimeString } = useMemo(() => {
    const now = new Date(timestamp);
    const h = now.getHours();
    const m = now.getMinutes();
    return {
      currentHour: h,
      currentMinute: m,
      currentTimeString: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    };
  }, [timestamp]);

  return (
    <section aria-labelledby="schedule-heading" className="space-y-4">
      <div className="flex items-baseline justify-between pb-3 border-b border-[#E4E8F0]">
        <div className="flex items-baseline gap-3">
          <h2
            id="schedule-heading"
            className="font-editorial text-2xl font-normal text-[#202536]"
          >
            Day Schedule
          </h2>
          <span className="text-xs font-mono text-[#697386]">
            {scheduledTasks.length} time blocks
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#3457D5]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3457D5] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3457D5]" />
          </span>
          <span>Now: {currentTimeString}</span>
        </div>
      </div>

      {scheduledTasks.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-[#D3D8E2] bg-white shadow-2xs text-center">
          <Clock className="w-8 h-8 text-[#697386] mx-auto mb-2 opacity-60" />
          <p className="font-editorial text-lg text-[#202536]">
            No schedule blocks created
          </p>
          <p className="mt-1 text-xs text-[#697386] max-w-xs mx-auto">
            Assign scheduled times to your tasks to visualize your daily flow and protect focus hours.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l border-[#E4E8F0] ml-3 sm:ml-4 space-y-6 py-2">
          {scheduledTasks.map((task) => {
            // Calculate end time
            const [hStr, mStr] = (task.scheduledTime || "09:00").split(":");
            const startH = parseInt(hStr, 10);
            const startM = parseInt(mStr, 10);
            const endTotalM = startH * 60 + startM + task.durationMinutes;
            const endH = Math.floor(endTotalM / 60);
            const endM = endTotalM % 60;
            const endTimeStr = `${String(endH).padStart(2, "0")}:${String(
              endM
            ).padStart(2, "0")}`;

            const isPassed =
              startH < currentHour ||
              (startH === currentHour && startM < currentMinute);

            return (
              <div key={task.id} className="relative group">
                {/* Timeline node */}
                <button
                  type="button"
                  onClick={() => onToggleComplete?.(task.id)}
                  aria-label={`Toggle completion for ${task.title}`}
                  className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    task.completed
                      ? "bg-[#247A52] border-[#247A52] text-white"
                      : isPassed
                      ? "bg-[#F0F3F9] border-[#D3D8E2] hover:border-[#3457D5]"
                      : "bg-white border-[#3457D5] hover:bg-[#E8EDFF]"
                  }`}
                >
                  {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </button>

                {/* Timeline card/entry */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    task.completed
                      ? "bg-[#F7F8FC]/70 border-[#E4E8F0] opacity-80"
                      : "bg-white border-[#E4E8F0] hover:border-[#3457D5]/40 shadow-2xs"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#3457D5]">
                        {task.scheduledTime} – {endTimeStr}
                      </span>
                      <span className="text-xs text-[#697386]">
                        ({task.durationMinutes}m)
                      </span>
                    </div>

                    <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F0F3F9] text-[#697386] self-start sm:self-auto">
                      {task.category}
                    </span>
                  </div>

                  <h3
                    className={`text-sm font-medium ${
                      task.completed
                        ? "line-through text-[#697386]"
                        : "text-[#202536]"
                    }`}
                  >
                    {task.title}
                  </h3>

                  {task.notes && (
                    <p className="mt-1 text-xs text-[#697386] line-clamp-1">
                      {task.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
