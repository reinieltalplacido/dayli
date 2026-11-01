'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Check,
  Tag,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { CalendarCategory, CalendarEvent } from '@/types/calendar';

interface SmartScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onOpenDetailedModal: (prefilled: Partial<CalendarEvent>) => void;
  categories: CalendarCategory[];
  currentDate: Date;
  userTimezone?: string;
}

interface ParsedEventResult {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isAllDay: boolean;
  location?: string;
  description?: string;
  categoryId?: string;
}

const EXAMPLE_PROMPTS = [
  'Dinner with Alex tomorrow at 7pm at Italian Bistro',
  'Math Final Exam next Monday 9 to 11am in Room 402',
  'Team sprint review this Friday at 3pm on Google Meet',
  'Gym session tomorrow 6am',
];

export const SmartScheduleModal: React.FC<SmartScheduleModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  onOpenDetailedModal,
  categories,
  currentDate,
  userTimezone,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedEventResult | null>(null);
  const [engineSource, setEngineSource] = useState<'gemini' | 'local' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setParsedResult(null);
      setErrorMessage('');
      setEngineSource(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleParse = async (textToParse?: string) => {
    const inputPrompt = (textToParse || prompt).trim();
    if (!inputPrompt) return;

    setIsLoading(true);
    setErrorMessage('');
    setParsedResult(null);

    try {
      const res = await fetch('/api/ai/parse-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputPrompt,
          categories: categories.map((c) => ({ id: c.id, name: c.name })),
          currentDate: currentDate.toISOString(),
          userTimezone: userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.event) {
        setParsedResult(data.event);
        setEngineSource(data.source);
      } else {
        setErrorMessage(data.error || 'Could not parse event. Please try again.');
      }
    } catch (err: unknown) {
      setErrorMessage('Network error while analyzing prompt.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCreate = () => {
    if (!parsedResult) return;
    onEventCreated({
      title: parsedResult.title,
      startDate: parsedResult.startDate,
      startTime: parsedResult.startTime,
      endDate: parsedResult.endDate,
      endTime: parsedResult.endTime,
      isAllDay: parsedResult.isAllDay,
      location: parsedResult.location,
      description: parsedResult.description,
      categoryId: parsedResult.categoryId || categories[0]?.id || 'personal',
    });
    onClose();
  };

  const handleEditInFull = () => {
    if (!parsedResult) return;
    onOpenDetailedModal({
      title: parsedResult.title,
      startDate: parsedResult.startDate,
      startTime: parsedResult.startTime,
      endDate: parsedResult.endDate,
      endTime: parsedResult.endTime,
      isAllDay: parsedResult.isAllDay,
      location: parsedResult.location,
      description: parsedResult.description,
      categoryId: parsedResult.categoryId || categories[0]?.id || 'personal',
    });
    onClose();
  };

  const matchedCategory = parsedResult?.categoryId
    ? categories.find((c) => c.id === parsedResult.categoryId)
    : categories[0];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4 bg-black/45 backdrop-blur-[6px] animate-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-[#18181A] rounded-2xl shadow-2xl border border-[#E5E5EA] dark:border-[#2C2C2E] overflow-hidden text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col animate-modal"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5EA] dark:border-[#28282A] bg-[#F5F5F7]/40 dark:bg-[#141416]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0A84FF] to-[#AF52DE] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Smart Schedule
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
                  Gemini AI
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <div className="p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleParse();
            }}
            className="space-y-3"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Dinner with Alex tomorrow at 7pm at Italian Bistro..."
                className="w-full pl-4 pr-11 py-3 text-sm sm:text-base rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-[#F5F5F7]/60 dark:bg-[#202022] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B]/60 dark:placeholder-[#98989D]/60 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/30 focus:border-[#0A84FF] shadow-xs transition-all"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className="absolute right-2 p-2 rounded-lg bg-[#0A84FF] hover:bg-[#0071E3] disabled:opacity-40 disabled:hover:bg-[#0A84FF] text-white shadow-xs transition-all"
                title="Analyze prompt"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Quick Example Chips */}
            {!parsedResult && !isLoading && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-[#86868B] dark:text-[#98989D]">
                  Quick examples:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_PROMPTS.map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(ex);
                        handleParse(ex);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F5F5F7] dark:bg-[#222226] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#303034] text-[#1D1D1F] dark:text-[#F5F5F7] transition-all text-left"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Loading state */}
          {isLoading && (
            <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-xs text-[#86868B] dark:text-[#98989D] animate-pulse">
              <Sparkles className="w-6 h-6 text-[#0A84FF] animate-spin" />
              <span>Analyzing phrasing with Gemini 2.0 Flash...</span>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-xs text-[#FF3B30]">
              {errorMessage}
            </div>
          )}

          {/* Parsed Result Preview Card */}
          {parsedResult && !isLoading && (
            <div className="p-4 rounded-xl border border-[#0A84FF]/30 dark:border-[#0A84FF]/40 bg-[#0A84FF]/[0.03] dark:bg-[#0A84FF]/[0.08] space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: matchedCategory?.color || '#0A84FF' }}
                  />
                  <h4 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                    {parsedResult.title}
                  </h4>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: matchedCategory?.lightBg || '#0A84FF15',
                    color: matchedCategory?.color || '#0A84FF',
                  }}
                >
                  {matchedCategory?.name || 'General'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#86868B] dark:text-[#98989D] pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0A84FF]" />
                  <span>
                    {parsedResult.startDate}
                    {parsedResult.endDate && parsedResult.endDate !== parsedResult.startDate && ` – ${parsedResult.endDate}`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#34C759]" />
                  <span>
                    {parsedResult.isAllDay
                      ? 'All-Day Event'
                      : `${parsedResult.startTime} – ${parsedResult.endTime}`}
                  </span>
                </div>

                {parsedResult.location && (
                  <div className="flex items-center gap-1.5 sm:col-span-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#FF9500] shrink-0" />
                    <span className="truncate">{parsedResult.location}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0A84FF]/20">
                <button
                  type="button"
                  onClick={handleEditInFull}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#202022] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors"
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCreate}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0071E3] active:bg-[#0062C4] text-xs font-semibold text-white shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add to Calendar</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-5 py-2.5 bg-[#F5F5F7] dark:bg-[#141416] border-t border-[#E5E5EA] dark:border-[#28282A] flex items-center justify-between text-[11px] text-[#86868B] dark:text-[#98989D]">
          <span className="flex items-center gap-1">
            <span>Powered by</span>
            <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">
              {engineSource === 'gemini' ? 'Gemini 2.0 Flash' : 'Google Gemini API'}
            </strong>
          </span>
          <a
            href="https://aistudio.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0A84FF] hover:underline flex items-center gap-1 font-medium"
          >
            <span>Get Free API Key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
