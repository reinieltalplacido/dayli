"use client";

import React, { useState } from "react";
import { Check, Trash2, Clock } from "lucide-react";
import { Task, Priority } from "@/types/planner";

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenAddTask: () => void;
}

const PRIORITY_BADGES: Record<
  Priority,
  { label: string; bg: string; text: string; dot: string }
> = {
  high: {
    label: "High",
    bg: "bg-[#FEECEC]",
    text: "text-[#C03535]",
    dot: "bg-[#C03535]",
  },
  medium: {
    label: "Medium",
    bg: "bg-[#FFF6E5]",
    text: "text-[#A86B12]",
    dot: "bg-[#A86B12]",
  },
  low: {
    label: "Low",
    bg: "bg-[#E8EDFF]",
    text: "text-[#3457D5]",
    dot: "bg-[#3457D5]",
  },
};

export function TaskList({
  tasks,
  onToggleComplete,
  onDeleteTask,
  onOpenAddTask,
}: TaskListProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  return (
    <section aria-labelledby="tasks-heading" className="space-y-4">
      {/* Header with Title and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E4E8F0] gap-3">
        <div className="flex items-baseline gap-3">
          <h2
            id="tasks-heading"
            className="font-editorial text-2xl font-normal text-[#202536]"
          >
            Daily Tasks
          </h2>
          <span className="text-xs font-mono text-[#697386]">
            {filteredTasks.length} {filteredTasks.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Filter controls */}
        <div className="inline-flex rounded-lg bg-[#F0F3F9] p-0.5 text-xs font-medium">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md transition-all ${
              filter === "all"
                ? "bg-white text-[#202536] shadow-2xs font-semibold"
                : "text-[#697386] hover:text-[#202536]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1 rounded-md transition-all ${
              filter === "pending"
                ? "bg-white text-[#202536] shadow-2xs font-semibold"
                : "text-[#697386] hover:text-[#202536]"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1 rounded-md transition-all ${
              filter === "completed"
                ? "bg-white text-[#202536] shadow-2xs font-semibold"
                : "text-[#697386] hover:text-[#202536]"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Task Rows List */}
      {filteredTasks.length === 0 ? (
        <div className="py-12 px-6 rounded-xl border border-dashed border-[#D3D8E2] text-center bg-white shadow-2xs">
          <p className="font-editorial text-lg text-[#202536]">
            {filter === "completed"
              ? "No completed tasks yet."
              : filter === "pending"
              ? "No pending tasks for today."
              : "No tasks scheduled for today."}
          </p>
          <p className="mt-1 text-xs text-[#697386]">
            {filter === "completed"
              ? "Mark items done as you progress through your plan."
              : "Keep your day intentional by adding your main priorities."}
          </p>
          {filter !== "completed" && (
            <button
              onClick={onOpenAddTask}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3457D5] text-white text-xs font-medium hover:bg-[#263C9A] transition-colors shadow-2xs"
            >
              Add first task
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-[#E4E8F0] rounded-xl border border-[#E4E8F0] bg-white overflow-hidden shadow-2xs">
          {filteredTasks.map((task) => {
            const badge = PRIORITY_BADGES[task.priority];

            return (
              <li
                key={task.id}
                className={`group flex items-start sm:items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4 transition-colors ${
                  task.completed
                    ? "bg-[#F7F8FC]/60 text-[#697386]"
                    : "hover:bg-[#F7F8FC]"
                }`}
              >
                {/* Checkbox and task content */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  {/* Custom Completion Button */}
                  <button
                    onClick={() => onToggleComplete(task.id)}
                    aria-label={`Mark "${task.title}" as ${
                      task.completed ? "uncompleted" : "completed"
                    }`}
                    className={`mt-0.5 sm:mt-0 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                      task.completed
                        ? "bg-[#247A52] border-[#247A52] text-white"
                        : "border-[#D3D8E2] bg-white hover:border-[#3457D5]"
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>

                  {/* Task details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-medium transition-all ${
                          task.completed
                            ? "line-through text-[#697386]"
                            : "text-[#202536]"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Metadata tags: Category, Time, Duration */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#697386]">
                      {/* Category */}
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-[#F0F3F9] text-[#697386]">
                        {task.category}
                      </span>

                      {/* Scheduled Time */}
                      {task.scheduledTime && (
                        <span className="flex items-center gap-1 font-mono text-[11px] text-[#697386]">
                          <Clock className="w-3 h-3 text-[#697386]" />
                          {task.scheduledTime}
                        </span>
                      )}

                      {/* Estimated Duration */}
                      {task.durationMinutes > 0 && (
                        <span className="font-mono text-[11px] text-[#697386]">
                          • {task.durationMinutes}m
                        </span>
                      )}

                      {/* Optional notes hint */}
                      {task.notes && (
                        <span
                          title={task.notes}
                          className="hidden sm:inline-block text-[11px] text-[#697386] italic truncate max-w-xs"
                        >
                          — {task.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Priority Badge & Delete action */}
                <div className="flex items-center gap-3 flex-shrink-0 pt-0.5 sm:pt-0">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    aria-label={`Delete "${task.title}"`}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-[#697386] hover:text-[#C03535] rounded-md hover:bg-[#FEECEC] transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
