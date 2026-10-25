"use client";

import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { Task, Priority, Category } from "@/types/planner";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, "id" | "createdAt">) => void;
  initialTime?: string;
}

const CATEGORIES: Category[] = [
  "Deep Work",
  "Writing",
  "Planning",
  "Admin",
  "Personal",
  "Health",
];

const DURATIONS = [
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "45m", value: 45 },
  { label: "1h", value: 60 },
  { label: "1.5h", value: 90 },
  { label: "2h", value: 120 },
];

export function AddTaskModal({
  isOpen,
  onClose,
  onAddTask,
  initialTime = "",
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState<Category>("Deep Work");
  const [scheduledTime, setScheduledTime] = useState(initialTime);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    onAddTask({
      title: title.trim(),
      completed: false,
      priority,
      category,
      scheduledTime: scheduledTime || undefined,
      durationMinutes,
      notes: notes.trim() || undefined,
    });

    // Reset and close
    setTitle("");
    setNotes("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#202536]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-[#E4E8F0] p-6 shadow-xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E4E8F0]">
          <div>
            <h2 className="font-editorial text-2xl font-normal text-[#202536]">
              New Dayli Task
            </h2>
            <p className="text-xs text-[#697386]">
              Give your day direction by defining a concrete outcome.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#697386] hover:text-[#202536] hover:bg-[#F0F3F9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="task-title"
              className="block text-xs font-mono uppercase tracking-wider text-[#697386] mb-1.5"
            >
              Task Title <span className="text-[#C03535]">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g., Draft Q4 roadmap and define milestones"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#D3D8E2] bg-white text-sm text-[#202536] placeholder-[#697386] focus:border-[#3457D5] focus:ring-1 focus:ring-[#3457D5] focus:outline-none"
            />
            {error && (
              <p className="mt-1 text-xs text-[#C03535] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>

          {/* Priority & Category in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#697386] mb-1.5">
                Priority
              </label>
              <div className="flex gap-1.5 p-1 rounded-lg bg-[#F0F3F9]">
                {(["low", "medium", "high"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 capitalize py-1.5 text-xs rounded-md font-medium transition-all ${
                      priority === p
                        ? "bg-white text-[#202536] shadow-2xs font-semibold"
                        : "text-[#697386] hover:text-[#202536]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="task-category"
                className="block text-xs font-mono uppercase tracking-wider text-[#697386] mb-1.5"
              >
                Category
              </label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 rounded-lg border border-[#D3D8E2] bg-white text-xs text-[#202536] focus:border-[#3457D5] focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Scheduled Time */}
            <div>
              <label
                htmlFor="task-time"
                className="block text-xs font-mono uppercase tracking-wider text-[#697386] mb-1.5"
              >
                Scheduled Time (Optional)
              </label>
              <div className="relative">
                <input
                  id="task-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D3D8E2] bg-white text-xs font-mono text-[#202536] focus:border-[#3457D5] focus:outline-none"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#697386] mb-1.5">
                Estimated Duration
              </label>
              <div className="grid grid-cols-3 gap-1">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDurationMinutes(d.value)}
                    className={`py-1.5 text-xs rounded-md font-mono transition-all border ${
                      durationMinutes === d.value
                        ? "bg-[#3457D5] text-white border-[#3457D5]"
                        : "bg-white text-[#697386] border-[#D3D8E2] hover:border-[#3457D5]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="task-notes"
              className="block text-xs font-mono uppercase tracking-wider text-[#697386] mb-1.5"
            >
              Notes or Context (Optional)
            </label>
            <input
              id="task-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Focus on milestone boundaries"
              className="w-full px-3 py-2 rounded-lg border border-[#D3D8E2] bg-white text-xs text-[#202536] placeholder-[#697386] focus:border-[#3457D5] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#E4E8F0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#D3D8E2] bg-white text-xs font-medium text-[#202536] hover:bg-[#F0F3F9] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#3457D5] text-xs font-medium text-white hover:bg-[#263C9A] shadow-2xs transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
