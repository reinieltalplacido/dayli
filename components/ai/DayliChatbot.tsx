'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Calendar,
  Check,
  CheckSquare,
  RotateCcw,
  Clock,
  MapPin,
  Bot,
} from 'lucide-react';
import { CalendarCategory, CalendarEvent, TaskItem } from '@/types/calendar';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: {
    type: 'create_event' | 'create_task';
    payload: any;
    executed?: boolean;
  };
}

interface DayliChatbotProps {
  events: CalendarEvent[];
  tasks: TaskItem[];
  categories: CalendarCategory[];
  currentDate: Date;
  userTimezone?: string;
  onSaveEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAddTask: (title: string, dueDate?: string, categoryId?: string) => void;
}

const QUICK_PROMPTS = [
  "What's on my schedule today?",
  "What tasks are due this week?",
  "Add gym session tomorrow at 6pm",
];

function renderFormattedContent(content: string) {
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('• ') || trimmed.startsWith('- ');
    const cleanLine = isBullet ? trimmed.replace(/^[\*•\-]\s*/, '') : line;

    // Bold replacement
    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const renderedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-inherit">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={idx} className="flex items-start gap-1.5 my-0.5">
          <span className="text-[#0A84FF] shrink-0 leading-relaxed">•</span>
          <span>{renderedParts}</span>
        </div>
      );
    }

    return (
      <div key={idx} className={line.trim() === '' ? 'h-1.5' : ''}>
        {renderedParts}
      </div>
    );
  });
}

export const DayliChatbot: React.FC<DayliChatbotProps> = ({
  events,
  tasks,
  categories,
  currentDate,
  userTimezone,
  onSaveEvent,
  onAddTask,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm Dayli AI. I can check your schedule, find free time, or schedule events and tasks for you. What can I do for you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  // Parse action codeblocks from model response
  const parseActionFromReply = (rawReply: string) => {
    let cleanReply = rawReply;
    let actionData: ChatMessage['action'] = undefined;

    const eventMatch = rawReply.match(/```action:create_event\s*([\s\S]*?)\s*```/);
    if (eventMatch && eventMatch[1]) {
      try {
        const payload = JSON.parse(eventMatch[1].trim());
        actionData = { type: 'create_event', payload, executed: false };
        cleanReply = rawReply.replace(eventMatch[0], '').trim();
      } catch (e) {
        console.error('Failed to parse event action:', e);
      }
    }

    const taskMatch = rawReply.match(/```action:create_task\s*([\s\S]*?)\s*```/);
    if (taskMatch && taskMatch[1]) {
      try {
        const payload = JSON.parse(taskMatch[1].trim());
        actionData = { type: 'create_task', payload, executed: false };
        cleanReply = rawReply.replace(taskMatch[0], '').trim();
      } catch (e) {
        console.error('Failed to parse task action:', e);
      }
    }

    return { cleanReply, actionData };
  };

  const handleSend = async (userText?: string) => {
    const text = (userText || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const newThread = [...messages, userMessage];
    setMessages(newThread);
    setInput('');
    setIsLoading(true);

    try {
      const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
      const simplifiedEvents = events.map((e) => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        startTime: e.startTime,
        endTime: e.endTime,
        isAllDay: e.isAllDay,
        location: e.location,
        categoryName: categoryMap.get(e.categoryId) || 'General',
      }));

      const simplifiedTasks = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        dueDate: t.dueDate,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newThread.map((m) => ({ role: m.role, content: m.content })),
          events: simplifiedEvents,
          tasks: simplifiedTasks,
          categories: categories.map((c) => ({ id: c.id, name: c.name })),
          currentDate: currentDate.toISOString(),
          userTimezone: userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const { cleanReply, actionData } = parseActionFromReply(data.reply);
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: cleanReply,
          action: actionData,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: "Sorry, I ran into an issue connecting to the AI assistant. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: "Network error. Please check your connection and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.action && !msg.action.executed) {
          if (msg.action.type === 'create_event') {
            const p = msg.action.payload;
            onSaveEvent({
              title: p.title || 'New Event',
              startDate: p.startDate,
              startTime: p.startTime || '09:00',
              endDate: p.endDate || p.startDate,
              endTime: p.endTime || '10:00',
              isAllDay: Boolean(p.isAllDay),
              location: p.location || undefined,
              categoryId: p.categoryId || categories[0]?.id || 'personal',
            });
          } else if (msg.action.type === 'create_task') {
            const p = msg.action.payload;
            onAddTask(p.title || 'New Task', p.dueDate || undefined, p.categoryId || undefined);
          }
          return {
            ...msg,
            action: { ...msg.action, executed: true },
          };
        }
        return msg;
      })
    );
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Chat cleared! How can I help you today?",
      },
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed right-4 sm:right-6 bottom-20 md:bottom-6 z-40 h-11 px-3.5 rounded-full bg-[#0A84FF] hover:bg-[#0071E3] active:scale-95 text-white shadow-[0_4px_16px_rgba(10,132,255,0.4)] flex items-center gap-2 transition-all duration-150 group"
          title="Open Dayli Assistant"
          aria-label="Dayli AI Assistant"
        >
          <Bot className="w-4 h-4 stroke-[2.3] group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold tracking-tight hidden sm:inline">Ask Assistant</span>
        </button>
      )}

      {/* Floating Chat Modal Popover */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-20 md:inset-auto md:right-6 md:bottom-6 z-50 w-auto md:w-[380px] h-[520px] max-h-[80vh] bg-white dark:bg-[#18181A] rounded-2xl shadow-2xl border border-[#E5E5EA] dark:border-[#2C2C2E] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#E5E5EA] dark:border-[#28282A] bg-[#F5F5F7]/60 dark:bg-[#151518]/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#0A84FF] text-white flex items-center justify-center">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Dayli Assistant
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-[#34C759]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                  <span>Calendar Connected</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#E5E5EA] dark:hover:bg-[#28282A] transition-colors"
                title="Clear conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#E5E5EA] dark:hover:bg-[#28282A] transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs leading-relaxed">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl ${
                      isUser
                        ? 'bg-[#0A84FF] text-white rounded-br-xs shadow-xs font-medium whitespace-pre-wrap'
                        : 'bg-[#F5F5F7] dark:bg-[#222226] text-[#1D1D1F] dark:text-[#F5F5F7] rounded-bl-xs border border-[#E5E5EA] dark:border-[#303034]'
                    }`}
                  >
                    {isUser ? m.content : renderFormattedContent(m.content)}
                  </div>

                  {/* Action Proposal Card */}
                  {m.action && (
                    <div className="mt-2 w-[90%] p-3 rounded-xl border border-[#0A84FF]/30 bg-[#0A84FF]/[0.05] dark:bg-[#0A84FF]/[0.10] text-[#1D1D1F] dark:text-[#F5F5F7] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#0A84FF]">
                        <span className="flex items-center gap-1.5">
                          {m.action.type === 'create_event' ? (
                            <Calendar className="w-3.5 h-3.5" />
                          ) : (
                            <CheckSquare className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {m.action.type === 'create_event'
                              ? 'Proposed Event'
                              : 'Proposed Task'}
                          </span>
                        </span>
                        {m.action.executed && (
                          <span className="text-[10px] text-[#34C759] flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Added</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-medium">
                        {m.action.payload.title}
                      </div>

                      {m.action.type === 'create_event' && (
                        <div className="text-[11px] text-[#86868B] dark:text-[#98989D] space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{m.action.payload.startDate}</span>
                          </div>
                          {!m.action.payload.isAllDay && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>
                                {m.action.payload.startTime} - {m.action.payload.endTime}
                              </span>
                            </div>
                          )}
                          {m.action.payload.location && (
                            <div className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{m.action.payload.location}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {!m.action.executed && (
                        <button
                          type="button"
                          onClick={() => handleExecuteAction(m.id)}
                          className="w-full mt-1 py-1.5 px-3 rounded-lg bg-[#0A84FF] hover:bg-[#0071E3] active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>
                            {m.action.type === 'create_event'
                              ? 'Add to Calendar'
                              : 'Add to Tasks'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#86868B] dark:text-[#98989D] px-2 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0A84FF]" />
                <span>Assistant is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts when thread is short */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-3 py-1.5 border-t border-[#E5E5EA]/60 dark:border-[#28282A]/60 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-[#F5F5F7] dark:bg-[#222226] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#303034] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 border-t border-[#E5E5EA] dark:border-[#28282A] bg-white dark:bg-[#18181A] shrink-0"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about schedule, free time, or add event..."
                className="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-[#F5F5F7] dark:bg-[#222226] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] dark:placeholder-[#98989D] border border-[#E5E5EA] dark:border-[#303034] focus:outline-none focus:ring-1 focus:ring-[#0A84FF] transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 p-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0071E3] disabled:opacity-30 disabled:hover:bg-[#0A84FF] text-white transition-colors"
                title="Send message"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

