"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DayHeader } from "@/components/dashboard/DayHeader";
import { DayProgress } from "@/components/dashboard/DayProgress";
import { TaskList } from "@/components/dashboard/TaskList";
import { ScheduleTimeline } from "@/components/dashboard/ScheduleTimeline";
import { DailyFocusCard } from "@/components/dashboard/DailyFocusCard";
import { AddTaskModal } from "@/components/dashboard/AddTaskModal";
import { INITIAL_TASKS } from "@/data/initialTasks";
import { Task } from "@/types/planner";
import {
  getTasksAction,
  createTaskAction,
  toggleTaskAction,
  deleteTaskAction,
} from "@/app/actions/tasks";
import { dbTaskToClient, CATEGORY_CLIENT_TO_DB } from "@/lib/mappers";

export default function MyDayPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialTimeForModal, setInitialTimeForModal] = useState("");

  // Load real tasks from database on mount
  useEffect(() => {
    async function loadDbTasks() {
      const res = await getTasksAction();
      if (res.success && res.tasks && res.tasks.length > 0) {
        setTasks(res.tasks.map(dbTaskToClient));
      }
    }
    loadDbTasks();
  }, []);

  // Toggle complete / uncomplete with database persistence
  const handleToggleComplete = async (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const nextCompleted = !task.completed;
          return {
            ...task,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return task;
      })
    );

    await toggleTaskAction(id);
  };

  // Delete task with database persistence
  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    await deleteTaskAction(id);
  };

  // Add new task with database persistence
  const handleAddTask = async (newTaskData: Omit<Task, "id" | "createdAt">) => {
    const tempId = `task-${Date.now()}`;
    const optimisticTask: Task = {
      ...newTaskData,
      id: tempId,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [optimisticTask, ...prev]);

    // Persist to database
    const res = await createTaskAction({
      title: newTaskData.title,
      notes: newTaskData.notes,
      priority: newTaskData.priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
      category: CATEGORY_CLIENT_TO_DB[newTaskData.category],
      scheduledTime: newTaskData.scheduledTime,
      durationMinutes: newTaskData.durationMinutes,
      isLocked: false,
    });

    if (res.success && res.task) {
      const savedTask = dbTaskToClient(res.task);
      setTasks((prev) =>
        prev.map((t) => (t.id === tempId ? savedTask : t))
      );
    }
  };

  const handleOpenAddModal = (time?: string) => {
    setInitialTimeForModal(time || "");
    setIsAddModalOpen(true);
  };

  return (
    <AppShell onOpenAddTask={() => handleOpenAddModal()}>
      <div className="space-y-8">
        {/* Editorial Day Header */}
        <DayHeader
          tasks={tasks}
          onOpenAddTask={() => handleOpenAddModal()}
        />

        {/* Compact Daily Progress Trajectory */}
        <DayProgress tasks={tasks} />

        {/* Main Content: Editorial Split between Tasks and Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Main Task List column */}
          <div className="lg:col-span-7 space-y-8">
            <TaskList
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
              onOpenAddTask={() => handleOpenAddModal()}
            />
          </div>

          {/* Contextual & Schedule column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Daily Intentional Focus */}
            <DailyFocusCard />

            {/* Daily Schedule Timeline */}
            <ScheduleTimeline
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              onOpenAddTaskWithTime={(time) => handleOpenAddModal(time)}
            />
          </div>
        </div>
      </div>

      {/* Add Task Modal Dialog */}
      <AddTaskModal
        key={isAddModalOpen ? `open-${initialTimeForModal}` : "closed"}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTask={handleAddTask}
        initialTime={initialTimeForModal}
      />
    </AppShell>
  );
}
