'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Zap,
  Bot,
  CheckSquare,
  Sparkles,
  Globe,
  Clock,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSmartSchedule?: () => void;
  onStartInteractiveTour?: () => void;
}

interface TutorialStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  bullets: {
    label: string;
    description: string;
    shortcut?: string;
  }[];
  tip?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenSmartSchedule,
  onStartInteractiveTour,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps: TutorialStep[] = [
    {
      id: 'navigation',
      badge: 'Step 1 of 6 • Calendar Basics',
      title: 'Navigating Your Calendar',
      subtitle: 'Smooth continuous scrolling and multiple flexible views.',
      icon: Calendar,
      iconBg: 'bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20',
      iconColor: 'text-[#0A84FF]',
      bullets: [
        {
          label: 'Month, Week & Day Views',
          description: 'Toggle views at the top right toolbar or mobile bottom navigation.',
          shortcut: 'M / W / D',
        },
        {
          label: 'Continuous Smooth Scrolling',
          description: 'Seamlessly scroll past month boundaries without disruptive page changes.',
        },
        {
          label: 'Instant Jump to Today',
          description: 'Return to today from any future or past date with one keystroke.',
          shortcut: 'T',
        },
      ],
      tip: 'Pro-tip: Click any date number in Month View to instantly switch to that day.',
    },
    {
      id: 'events',
      badge: 'Step 2 of 6 • Creating Events',
      title: 'Creating & Managing Events',
      subtitle: 'Quickly organize your schedule with custom categories and colors.',
      icon: Clock,
      iconBg: 'bg-[#34C759]/10 dark:bg-[#34C759]/20',
      iconColor: 'text-[#34C759]',
      bullets: [
        {
          label: 'Click Any Date Cell',
          description: 'Click anywhere on a month cell or hourly timeline to create an event at that exact time.',
        },
        {
          label: 'Quick New Event Shortcut',
          description: 'Press N anywhere in the app to open the New Event modal.',
          shortcut: 'N',
        },
        {
          label: 'Custom Calendar Categories',
          description: 'Organize with Personal, School, Deadlines, Meetings, or create custom calendars.',
        },
      ],
      tip: 'Uncheck any calendar in the sidebar under "MY CALENDARS" to temporarily hide its events.',
    },
    {
      id: 'smart-schedule',
      badge: 'Step 3 of 6 • Smart Scheduling',
      title: 'Smart Schedule Quick-Add',
      subtitle: 'Schedule events by typing naturally in plain English.',
      icon: Zap,
      iconBg: 'bg-[#FF9500]/10 dark:bg-[#FF9500]/20',
      iconColor: 'text-[#FF9500]',
      bullets: [
        {
          label: 'Natural Language Parsing',
          description: 'Type: "Dinner with Alex tomorrow at 7pm at Italian Bistro" and Dayli extracts the title, date, start/end time, and venue.',
          shortcut: 'Ctrl + J',
        },
        {
          label: 'Instant Category Match',
          description: 'Automatically detects whether your event is a Meeting, Deadline, or Personal event.',
        },
        {
          label: 'One-Click Confirmation',
          description: 'Preview the parsed schedule with one click before adding it to your timeline.',
        },
      ],
      tip: 'Press Ctrl+J anytime to open the Smart Schedule parser instantly.',
      actionButton: onOpenSmartSchedule
        ? {
            label: 'Try Smart Schedule Now',
            onClick: () => {
              onClose();
              onOpenSmartSchedule();
            },
          }
        : undefined,
    },
    {
      id: 'chatbot',
      badge: 'Step 4 of 6 • Dayli AI Assistant',
      title: 'Calendar Chatbot Assistant',
      subtitle: 'Your personal AI assistant connected directly to your calendar.',
      icon: Bot,
      iconBg: 'bg-[#AF52DE]/10 dark:bg-[#AF52DE]/20',
      iconColor: 'text-[#AF52DE]',
      bullets: [
        {
          label: 'Ask About Your Day',
          description: 'Tap "Ask Assistant" at the bottom right. Ask: "What is on my schedule today?" or "Do I have free time on Friday afternoon?".',
        },
        {
          label: 'Hands-Free Scheduling',
          description: 'Say: "Add gym session tomorrow at 6pm" and click the "Add to Calendar" confirmation card inside the chat.',
        },
        {
          label: '100% Strictly Factual',
          description: 'The assistant only checks your active visible calendars, never making up phantom events.',
        },
      ],
      tip: 'You can clear chat history anytime using the restart icon at the top of the chat window.',
    },
    {
      id: 'tasks',
      badge: 'Step 5 of 6 • Tasks & Reminders',
      title: 'Tasks & Reminders Drawer',
      subtitle: 'Keep your to-do list and focus items alongside your schedule.',
      icon: CheckSquare,
      iconBg: 'bg-[#30B0C7]/10 dark:bg-[#30B0C7]/20',
      iconColor: 'text-[#30B0C7]',
      bullets: [
        {
          label: 'Tasks & Reminders Panel',
          description: 'Click "Tasks & Reminders" in the sidebar or checkmark button in the header toolbar to slide out your checklist.',
        },
        {
          label: 'Due Dates & Completion',
          description: 'Assign due dates to tasks to keep track of deadlines directly in your calendar workflow.',
        },
        {
          label: 'Categorized To-dos',
          description: 'Filter and tag tasks by category to match your calendar color system.',
        },
      ],
      tip: 'Completed tasks are checked off without disappearing so you can review what you finished.',
    },
    {
      id: 'holidays-sync',
      badge: 'Step 6 of 6 • Holidays & Cloud Sync',
      title: 'Public Holidays & Cloud Sync',
      subtitle: 'Stay synchronized with national holidays and across all your devices.',
      icon: Globe,
      iconBg: 'bg-[#FF2D55]/10 dark:bg-[#FF2D55]/20',
      iconColor: 'text-[#FF2D55]',
      bullets: [
        {
          label: 'Official National Holidays',
          description: 'Public holidays automatically display in pink. Change your country anytime in Preferences & Settings > Time & Regional.',
        },
        {
          label: 'Real-Time Cloud Sync',
          description: 'Sign in with Google to sync your calendar across your phone, tablet, and laptop in real time.',
        },
        {
          label: 'Full iCalendar Portability',
          description: 'Export or import industry-standard .ics files for Apple Calendar, Google Calendar, and Outlook.',
        },
      ],
      tip: 'Preferences & Settings (bottom of sidebar) lets you customize timezones, 12h/24h time, and appearance.',
    },
  ];

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation: Escape to close, Arrow keys to navigate
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, steps.length, onClose]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const StepIcon = currentStep.icon;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-[6px] animate-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-[#18181A] rounded-2xl shadow-2xl border border-[#E5E5EA] dark:border-[#2C2C2E] overflow-hidden text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col max-h-[90vh] animate-modal"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5EA] dark:border-[#28282A] bg-[#F5F5F7]/40 dark:bg-[#141416]/50 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0A84FF]" />
            <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              How to Use Dayli
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Step navigation dots */}
            <div className="flex items-center gap-1 mr-2">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? 'w-5 bg-[#0A84FF]'
                      : 'w-1.5 bg-[#86868B]/30 hover:bg-[#86868B]/60'
                  }`}
                  title={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {onStartInteractiveTour && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartInteractiveTour();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#0A84FF] bg-[#0A84FF]/10 hover:bg-[#0A84FF]/20 rounded-lg transition-colors"
                title="Start interactive spotlight tour"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Start Walkthrough</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#E5E5EA] dark:hover:bg-[#28282A] transition-colors"
              title="Close guide (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Step Header */}
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl ${currentStep.iconBg} ${currentStep.iconColor} flex items-center justify-center shrink-0 shadow-xs`}
            >
              <StepIcon className="w-5 h-5 stroke-[2.2]" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0A84FF] bg-[#0A84FF]/10 px-2 py-0.5 rounded-full">
                {currentStep.badge}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] mt-1 tracking-tight">
                {currentStep.title}
              </h2>
              <p className="text-xs text-[#86868B] dark:text-[#98989D] mt-0.5">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          {/* Key Feature Bullets */}
          <div className="space-y-2.5 pt-1">
            {currentStep.bullets.map((b, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#F5F5F7]/70 dark:bg-[#202022]/70 border border-[#E5E5EA] dark:border-[#2C2C2E] flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {b.label}
                  </p>
                  <p className="text-[11px] text-[#86868B] dark:text-[#98989D] leading-relaxed">
                    {b.description}
                  </p>
                </div>
                {b.shortcut && (
                  <kbd className="px-2 py-0.5 rounded bg-white dark:bg-[#28282A] border border-[#E5E5EA] dark:border-[#38383A] text-[10px] font-mono font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] shrink-0 shadow-2xs">
                    {b.shortcut}
                  </kbd>
                )}
              </div>
            ))}
          </div>

          {/* Pro Tip Callout */}
          {currentStep.tip && (
            <div className="p-3 rounded-xl bg-[#0A84FF]/[0.06] dark:bg-[#0A84FF]/[0.10] border border-[#0A84FF]/20 text-xs text-[#0A84FF] leading-relaxed flex items-center gap-2">
              <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                💡 {currentStep.tip}
              </span>
            </div>
          )}

          {/* Optional Direct Action (e.g. Try Smart Schedule) */}
          {currentStep.actionButton && (
            <div className="pt-1">
              <button
                type="button"
                onClick={currentStep.actionButton.onClick}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#0A84FF] to-[#0071E3] hover:brightness-105 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <span>{currentStep.actionButton.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-5 py-3 border-t border-[#E5E5EA] dark:border-[#28282A] bg-[#F5F5F7]/40 dark:bg-[#141416]/50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#202022] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] disabled:opacity-40 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-[11px] font-medium text-[#86868B] dark:text-[#98989D]">
            {currentStepIndex + 1} of {steps.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0071E3] active:bg-[#0062C4] text-xs font-semibold text-white shadow-xs transition-all"
          >
            <span>{currentStepIndex === steps.length - 1 ? 'Got it!' : 'Next'}</span>
            {currentStepIndex < steps.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

