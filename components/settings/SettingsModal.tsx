'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  Upload,
  Trash2,
  Check,
  Moon,
  Sun,
  Sliders,
  HelpCircle,
  Command,
  Clock,
  Globe,
  Shield,
  Laptop,
  Smartphone,
  AlertTriangle,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { DayliLogo } from '../ui/DayliLogo';
import { TimezoneSelect } from './TimezoneSelect';
import { useSettings, settingsService, DateFormat, ClockFormat } from '@/services/settingsService';
import { exportToICS, parseICS, downloadFile } from '@/lib/icsUtils';
import { CalendarEvent } from '@/types/calendar';
import { authClient } from '@/lib/auth-client';
import { format } from 'date-fns';

export type SettingsTab = 'general' | 'regional' | 'privacy' | 'devices' | 'shortcuts';

interface ActiveSession {
  id: string;
  isCurrent: boolean;
  browser: string;
  os: string;
  type: 'desktop' | 'mobile' | 'tablet';
  ipAddress: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onImportEvents: (newEvents: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>[]) => number;
  onImportJSON: (jsonStr: string) => boolean;
  onClearAllData: () => Promise<void> | void;
  onSignOut: () => void;
  isUserSignedIn?: boolean;
  initialTab?: SettingsTab;
}

// Common timezones curated for quick selection
const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada) - New York' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada) - Chicago' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada) - Denver' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada) - Los Angeles' },
  { value: 'America/Toronto', label: 'Eastern Time - Toronto' },
  { value: 'America/Sao_Paulo', label: 'Brasilia Time - São Paulo' },
  { value: 'Europe/London', label: 'Greenwich Mean Time - London, Dublin' },
  { value: 'Europe/Paris', label: 'Central European Time - Paris, Berlin, Rome' },
  { value: 'Europe/Berlin', label: 'Central European Time - Berlin' },
  { value: 'Europe/Moscow', label: 'Moscow Standard Time' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time - Dubai' },
  { value: 'Asia/Kolkata', label: 'India Standard Time - New Delhi, Mumbai' },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong Time' },
  { value: 'Asia/Shanghai', label: 'China Standard Time - Beijing, Shanghai' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time - Tokyo' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time - Seoul' },
  { value: 'Asia/Manila', label: 'Philippine Standard Time - Manila' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time - Sydney, Melbourne' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time - Auckland' },
  { value: 'Pacific/Honolulu', label: 'Hawaii-Aleutian Time - Honolulu' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  events,
  onImportEvents,
  onImportJSON,
  onClearAllData,
  onSignOut,
  isUserSignedIn = false,
  initialTab = 'general',
}) => {
  const settings = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync tab on modal open during render without triggering cascading effects
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setActiveTab(initialTab);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  // Active sessions state for Connected Devices tab
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  // Confirmation dialogs
  const [confirmClearDataOpen, setConfirmClearDataOpen] = useState(false);
  const [confirmDeleteAccountOpen, setConfirmDeleteAccountOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const { data: authSession } = authClient.useSession();

  // Load sessions when entering devices tab
  const refreshSessions = useCallback(async () => {
    if (!isUserSignedIn) return;
    setIsLoadingSessions(true);
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [isUserSignedIn]);

  useEffect(() => {
    if (!isOpen || !isUserSignedIn) return;
    let isMounted = true;
    if (activeTab === 'devices') {
      fetch('/api/sessions')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (isMounted) setSessions(data);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTab, isUserSignedIn]);

  // Status message auto-dismiss
  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Live time preview in selected timezone
  const [currentTimeInZone, setCurrentTimeInZone] = useState('');
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-US', {
          timeZone: settings.timeZone,
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: settings.clockFormat === '12h',
        }).format(now);
        setCurrentTimeInZone(formatted);
      } catch {
        setCurrentTimeInZone('');
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.timeZone, settings.clockFormat]);

  if (!isOpen) return null;

  // Handle iCalendar (.ics) Export
  const handleExportICS = () => {
    try {
      const icsData = exportToICS(events, 'Dayli Calendar');
      const filename = `dayli-calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
      downloadFile(icsData, filename, 'text/calendar;charset=utf-8');
      showStatus(`Exported ${events.length} events to iCalendar (.ics)`);
    } catch {
      showStatus('Failed to generate .ics file', 'error');
    }
  };

  // Handle JSON Export
  const handleExportJSON = () => {
    try {
      const jsonStr = JSON.stringify(events, null, 2);
      const filename = `dayli-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      downloadFile(jsonStr, filename, 'application/json');
      showStatus(`Exported ${events.length} events to JSON archive`);
    } catch {
      showStatus('Failed to export JSON', 'error');
    }
  };

  // Handle File Upload for .ics or .json
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isICS = file.name.toLowerCase().endsWith('.ics');
    const isJSON = file.name.toLowerCase().endsWith('.json');

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      if (isICS) {
        try {
          const parsed = parseICS(content);
          if (parsed.length === 0) {
            showStatus('No valid events found in .ics file', 'error');
            return;
          }
          const addedCount = onImportEvents(parsed);
          showStatus(`Successfully imported ${addedCount} events from ${file.name}!`);
        } catch {
          showStatus('Failed to parse .ics file', 'error');
        }
      } else if (isJSON) {
        const success = onImportJSON(content);
        if (success) {
          showStatus(`Successfully imported events from ${file.name}!`);
        } else {
          showStatus('Failed to parse JSON file', 'error');
        }
      } else {
        showStatus('Please upload a .ics or .json file', 'error');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Revoke session remotely
  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      const res = await fetch(`/api/sessions?id=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        showStatus('Device session revoked successfully');
      } else {
        showStatus('Failed to revoke session', 'error');
      }
    } catch {
      showStatus('Error revoking session', 'error');
    } finally {
      setRevokingSessionId(null);
    }
  };

  // Clear all calendar data
  const handleClearCalendarData = async () => {
    try {
      if (isUserSignedIn) {
        await fetch('/api/account?action=clear-data', { method: 'DELETE' });
      }
      await onClearAllData();
      setConfirmClearDataOpen(false);
      showStatus('All calendar data and tasks cleared');
    } catch {
      showStatus('Failed to clear data', 'error');
    }
  };

  // Delete user account permanently
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      showStatus('Please type DELETE to confirm', 'error');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/account?action=delete-account', {
        method: 'DELETE',
      });
      if (res.ok) {
        setConfirmDeleteAccountOpen(false);
        onSignOut();
        onClose();
        alert('Your Dayli account and data have been permanently deleted.');
        window.location.reload();
      } else {
        showStatus('Failed to delete account', 'error');
      }
    } catch {
      showStatus('Error deleting account', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Auto-detect browser timezone
  const handleAutoDetectTimezone = () => {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        settingsService.updateSettings({ timeZone: detected });
        showStatus(`Time zone set to ${detected}`);
      }
    }
  };

  const shortcuts = [
    { key: 'T', description: 'Jump to Today' },
    { key: 'M', description: 'Switch to Month view' },
    { key: 'W', description: 'Switch to Week view' },
    { key: 'D', description: 'Switch to Day view' },
    { key: 'N', description: 'Create New Event' },
    { key: '/', description: 'Open Search dialog' },
    { key: 'Esc', description: 'Close any open modal or panel' },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[4px] animate-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-[#E5E5EA] dark:border-[#38383A] overflow-hidden text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col max-h-[88vh] animate-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <DayliLogo size={22} />
            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Preferences & Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F5F5F7]/30 dark:bg-[#202022]/40 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 pb-2 px-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'general'
                ? 'border-[#0A84FF] text-[#0A84FF]'
                : 'border-transparent text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>General</span>
          </button>

          <button
            onClick={() => setActiveTab('regional')}
            className={`flex items-center gap-1.5 pb-2 px-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'regional'
                ? 'border-[#0A84FF] text-[#0A84FF]'
                : 'border-transparent text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Time & Regional</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-1.5 pb-2 px-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'privacy'
                ? 'border-[#0A84FF] text-[#0A84FF]'
                : 'border-transparent text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy & Data</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-1.5 pb-2 px-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'devices'
                ? 'border-[#0A84FF] text-[#0A84FF]'
                : 'border-transparent text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Connected Devices</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-1.5 pb-2 px-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'shortcuts'
                ? 'border-[#0A84FF] text-[#0A84FF]'
                : 'border-transparent text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            <Command className="w-3.5 h-3.5" />
            <span>Shortcuts & Help</span>
          </button>
        </div>

        {/* Global Toast Feedback inside modal */}
        {statusMessage && (
          <div
            className={`px-4 py-2 text-xs flex items-center gap-2 border-b transition-all ${
              statusMessage.type === 'success'
                ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20'
                : 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                  Appearance Theme
                </label>
                <p className="text-[11px] text-[#86868B] dark:text-[#98989D] mb-2.5">
                  Select your interface color theme
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => settingsService.updateSettings({ theme: 'light' })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                      settings.theme === 'light'
                        ? 'border-[#0A84FF] bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20 shadow-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]'
                        : 'border-[#E5E5EA] dark:border-[#38383A] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-center text-[#FF9500]">
                      <Sun className="w-4 h-4" />
                    </div>
                    <span className="text-xs">Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => settingsService.updateSettings({ theme: 'system' })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                      settings.theme === 'system'
                        ? 'border-[#0A84FF] bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20 shadow-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]'
                        : 'border-[#E5E5EA] dark:border-[#38383A] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1D1D1F] dark:bg-[#2C2C2E] text-white flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <span className="text-xs">System</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => settingsService.updateSettings({ theme: 'dark' })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                      settings.theme === 'dark'
                        ? 'border-[#0A84FF] bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20 shadow-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]'
                        : 'border-[#E5E5EA] dark:border-[#38383A] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1D1D1F] dark:bg-[#2C2C2E] text-white flex items-center justify-center">
                      <Moon className="w-4 h-4 text-[#0A84FF]" />
                    </div>
                    <span className="text-xs">Dark</span>
                  </button>
                </div>
              </div>

              {/* Dayli Info Card */}
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] dark:bg-[#242426] border border-[#E5E5EA] dark:border-[#38383A] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DayliLogo size={18} />
                    <span className="font-semibold text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">Dayli Calendar</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#0A84FF] bg-[#0A84FF]/10 px-2 py-0.5 rounded-full">
                    Production v1.0
                  </span>
                </div>
                <p className="text-[11px] text-[#86868B] dark:text-[#98989D] leading-relaxed">
                  Fast, focused personal calendar & task workspace with continuous scrolling, Neon PostgreSQL cloud sync, and full iCalendar portability.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TIME & REGIONAL */}
          {activeTab === 'regional' && (
            <div className="space-y-4">
              {/* Time Zone */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#0A84FF]" />
                    <span>Time Zone</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoDetectTimezone}
                    className="text-[11px] font-medium text-[#0A84FF] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-detect</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#86868B] dark:text-[#98989D] mb-2">
                  All dates and times display relative to this zone
                </p>

                {/* Custom Timezone Dropdown UI */}
                <TimezoneSelect
                  value={settings.timeZone}
                  onChange={(timeZone) => settingsService.updateSettings({ timeZone })}
                  timezones={COMMON_TIMEZONES}
                />

                {currentTimeInZone && (
                  <p className="text-[11px] text-[#86868B] dark:text-[#98989D] mt-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#34C759]" />
                    <span>Current local time: </span>
                    <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{currentTimeInZone}</span>
                  </p>
                )}
              </div>

              {/* Date Format */}
              <div className="pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                  Date Format
                </label>
                <p className="text-[11px] text-[#86868B] dark:text-[#98989D] mb-2">
                  Choose how calendar dates are presented
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'MM/DD/YYYY', label: 'MM/DD/YYYY', sample: '10/29/2026' },
                      { id: 'DD/MM/YYYY', label: 'DD/MM/YYYY', sample: '29/10/2026' },
                      { id: 'YYYY-MM-DD', label: 'YYYY-MM-DD', sample: '2026-10-29' },
                    ] as const
                  ).map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => settingsService.updateSettings({ dateFormat: fmt.id as DateFormat })}
                      className={`flex flex-col items-center p-2.5 rounded-lg border text-xs text-center transition-all ${
                        settings.dateFormat === fmt.id
                          ? 'border-[#0A84FF] bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20 text-[#0A84FF] font-medium'
                          : 'border-[#E5E5EA] dark:border-[#38383A] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7]'
                      }`}
                    >
                      <span className="font-mono text-xs">{fmt.label}</span>
                      <span className="text-[10px] text-[#86868B] dark:text-[#98989D] mt-0.5">{fmt.sample}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* First Day of the Week */}
              <div className="pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                  First Day of the Week
                </label>
                <p className="text-[11px] text-[#86868B] dark:text-[#98989D] mb-2">
                  Select which day starts the week in month, week, and sidebar calendars
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => settingsService.updateSettings({ weekStartsOn: 0 })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      settings.weekStartsOn === 0
                        ? 'border-[#0A84FF] bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20 text-[#0A84FF]'
                        : 'border-[#E5E5EA] dark:border-[#38383A] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7]'
                    }`}
                  >
                    Sunday
                  </button>
                  <button
                    type="button"
                    onClick={() => settingsService.updateSettings({ weekStartsOn: 1 })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      settings.weekStartsOn === 1
                        ? 'border-[#0A84FF] bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20 text-[#0A84FF]'
                        : 'border-[#E5E5EA] dark:border-[#38383A] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7]'
                    }`}
                  >
                    Monday
                  </button>
                </div>
              </div>

              {/* Regional Preferences: Time Clock Format */}
              <div className="pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                  Regional Time Clock Format
                </label>
                <p className="text-[11px] text-[#86868B] dark:text-[#98989D] mb-2">
                  Display schedule hours using 12-hour or 24-hour notation
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => settingsService.updateSettings({ clockFormat: '12h' as ClockFormat })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      settings.clockFormat === '12h'
                        ? 'border-[#0A84FF] bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20 text-[#0A84FF]'
                        : 'border-[#E5E5EA] dark:border-[#38383A] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7]'
                    }`}
                  >
                    12-hour (e.g. 1:30 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => settingsService.updateSettings({ clockFormat: '24h' as ClockFormat })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      settings.clockFormat === '24h'
                        ? 'border-[#0A84FF] bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20 text-[#0A84FF]'
                        : 'border-[#E5E5EA] dark:border-[#38383A] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7]'
                    }`}
                  >
                    24-hour (e.g. 13:30)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & DATA */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              {/* Connected Google Account */}
              <div>
                <h4 className="text-[11px] font-semibold text-[#86868B] dark:text-[#98989D] uppercase tracking-wider mb-2">
                  Connected Google Account
                </h4>
                <div className="p-3 rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-[#F5F5F7]/50 dark:bg-[#242426]/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-center shrink-0 shadow-xs">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    </div>
                    <div>
                      {isUserSignedIn ? (
                        <>
                          <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                            {authSession?.user?.name || authSession?.user?.email || 'Google User'}
                          </p>
                          <p className="text-[11px] text-[#86868B] dark:text-[#98989D] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                            <span>Connected via Google OAuth</span>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Google Account</p>
                          <p className="text-[11px] text-[#86868B] dark:text-[#98989D]">
                            Sign in to enable real-time cloud synchronization
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {isUserSignedIn ? (
                    <button
                      type="button"
                      onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/' })}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#2C2C2E] hover:bg-[#F5F5F7] dark:hover:bg-[#343438] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors"
                    >
                      Reconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/' })}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#0A84FF] text-white hover:bg-[#0071E3] transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Export & Import Calendar Data */}
              <div className="pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
                <h4 className="text-[11px] font-semibold text-[#86868B] dark:text-[#98989D] uppercase tracking-wider mb-2">
                  Export & Import Calendar Data
                </h4>
                <p className="text-[11px] text-[#86868B] dark:text-[#98989D] mb-2.5">
                  Export to industry-standard iCalendar format (.ics) for Apple Calendar, Google Calendar, and Microsoft Outlook, or import external files.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleExportICS}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#0A84FF]/30 dark:border-[#0A84FF]/40 bg-[#0A84FF]/5 dark:bg-[#0A84FF]/15 hover:bg-[#0A84FF]/10 text-[#0A84FF] font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export to .ics (iCal)</span>
                  </button>

                  <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#E5E5EA] dark:border-[#38383A] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] font-medium transition-colors cursor-pointer text-[#1D1D1F] dark:text-[#F5F5F7]">
                    <Upload className="w-3.5 h-3.5 text-[#34C759]" />
                    <span>Import .ics / .json</span>
                    <input
                      type="file"
                      accept=".ics,.json,text/calendar,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="text-[11px] text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download raw JSON archive</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone: Clear Data & Account Deletion */}
              <div className="pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E] space-y-2">
                <h4 className="text-[11px] font-semibold text-[#FF3B30] uppercase tracking-wider">
                  Danger Zone
                </h4>

                {/* Delete all calendar data */}
                {!confirmClearDataOpen ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClearDataOpen(true)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#FF3B30]/30 hover:bg-[#FF3B30]/5 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-[#FF3B30]" />
                      <div>
                        <p className="font-medium text-[#FF3B30]">Delete All Calendar Data</p>
                        <p className="text-[11px] text-[#86868B] dark:text-[#98989D]">
                          Wipe all events and tasks from this calendar
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#FF3B30] font-medium">Clear</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-lg border border-[#FF3B30]/40 bg-[#FF3B30]/5 space-y-2">
                    <p className="text-xs font-semibold text-[#FF3B30] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Are you sure you want to clear all calendar data?</span>
                    </p>
                    <p className="text-[11px] text-[#86868B] dark:text-[#98989D]">
                      This will delete all events and tasks from your schedule. This action cannot be undone.
                    </p>
                    <div className="flex items-center gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setConfirmClearDataOpen(false)}
                        className="px-2.5 py-1 text-xs rounded border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#343438]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleClearCalendarData}
                        className="px-2.5 py-1 text-xs rounded bg-[#FF3B30] text-white hover:bg-[#E02D22] font-medium"
                      >
                        Yes, Delete Everything
                      </button>
                    </div>
                  </div>
                )}

                {/* Account Deletion */}
                {isUserSignedIn && (
                  <>
                    {!confirmDeleteAccountOpen ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAccountOpen(true)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#FF3B30]/30 hover:bg-[#FF3B30]/5 text-left transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut className="w-4 h-4 text-[#FF3B30]" />
                          <div>
                            <p className="font-medium text-[#FF3B30]">Delete Dayli Account</p>
                            <p className="text-[11px] text-[#86868B] dark:text-[#98989D]">
                              Permanently remove your account and all synchronized cloud records
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#FF3B30] font-medium">Delete</span>
                      </button>
                    ) : (
                      <div className="p-3 rounded-lg border border-[#FF3B30] bg-[#FF3B30]/5 space-y-2">
                        <p className="text-xs font-bold text-[#FF3B30] flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Permanently Delete Account</span>
                        </p>
                        <p className="text-[11px] text-[#86868B] dark:text-[#98989D]">
                          To permanently delete your user profile, active sessions, and cloud schedules, please type <strong>DELETE</strong> below:
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmationText}
                          onChange={(e) => setDeleteConfirmationText(e.target.value)}
                          placeholder="Type DELETE"
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-[#FF3B30]/50 bg-white dark:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-hidden"
                        />
                        <div className="flex items-center gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteAccountOpen(false);
                              setDeleteConfirmationText('');
                            }}
                            className="px-2.5 py-1 text-xs rounded border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#343438]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={deleteConfirmationText.trim().toUpperCase() !== 'DELETE' || isDeletingAccount}
                            onClick={handleDeleteAccount}
                            className="px-2.5 py-1 text-xs rounded bg-[#FF3B30] text-white hover:bg-[#E02D22] font-semibold disabled:opacity-50"
                          >
                            {isDeletingAccount ? 'Deleting...' : 'Permanently Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CONNECTED DEVICES */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              {/* Cloud Sync Status */}
              <div>
                <h4 className="text-[11px] font-semibold text-[#86868B] dark:text-[#98989D] uppercase tracking-wider mb-2">
                  Cloud Sync Status
                </h4>
                <div className="p-3 rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-[#F5F5F7]/50 dark:bg-[#242426]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isUserSignedIn ? 'bg-[#34C759] animate-pulse' : 'bg-[#FF9500]'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {isUserSignedIn ? 'Cloud Synced' : 'Local Storage Mode (Offline)'}
                      </p>
                      <p className="text-[11px] text-[#86868B] dark:text-[#98989D]">
                        {isUserSignedIn
                          ? 'Synchronized with Neon PostgreSQL server in real time'
                          : 'Schedules are stored locally on this machine'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] text-[#86868B] dark:text-[#98989D]">
                    {isUserSignedIn ? 'Active' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Active Sessions & Devices */}
              <div className="pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-semibold text-[#86868B] dark:text-[#98989D] uppercase tracking-wider">
                    Active Sessions & Devices
                  </h4>
                  {isUserSignedIn && (
                    <button
                      type="button"
                      onClick={refreshSessions}
                      className="text-[11px] text-[#0A84FF] hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  )}
                </div>

                {!isUserSignedIn ? (
                  <div className="p-3.5 rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#202022] text-center space-y-1">
                    <Laptop className="w-6 h-6 text-[#86868B] dark:text-[#98989D] mx-auto mb-1" />
                    <p className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">This Device (Guest)</p>
                    <p className="text-[11px] text-[#86868B] dark:text-[#98989D]">
                      Sign in with Google to view active sessions across all your devices and manage remote access.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.length === 0 && !isLoadingSessions && (
                      <p className="text-xs text-[#86868B] dark:text-[#98989D] italic">No active sessions retrieved.</p>
                    )}

                    {sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3 rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#202022] flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] dark:bg-[#28282A] border border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-center text-[#1D1D1F] dark:text-[#F5F5F7]">
                            {sess.type === 'mobile' ? (
                              <Smartphone className="w-4 h-4" />
                            ) : (
                              <Laptop className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                                {sess.browser} on {sess.os}
                              </p>
                              {sess.isCurrent && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-[#34C759]/15 text-[#34C759] rounded-full">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#86868B] dark:text-[#98989D]">
                              IP: {sess.ipAddress} • Last active:{' '}
                              {format(new Date(sess.updatedAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <button
                            type="button"
                            disabled={revokingSessionId === sess.id}
                            onClick={() => handleRevokeSession(sess.id)}
                            className="px-2.5 py-1 text-[11px] font-medium text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded border border-[#FF3B30]/30 transition-colors disabled:opacity-50"
                          >
                            {revokingSessionId === sess.id ? 'Revoking...' : 'Sign Out'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop App Connections (Future) */}
              <div className="pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-[11px] font-semibold text-[#86868B] dark:text-[#98989D] uppercase tracking-wider">
                    Desktop App Connections
                  </h4>
                  <span className="text-[10px] font-semibold text-[#0A84FF] bg-[#0A84FF]/10 px-2 py-0.5 rounded-full">
                    Future (v2.0)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-[#E5E5EA] dark:border-[#38383A] bg-[#F5F5F7]/40 dark:bg-[#242426]/40 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#28282A] border border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-center text-[#0A84FF] shrink-0">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Dayli Windows & macOS Desktop</p>
                    <p className="text-[11px] text-[#86868B] dark:text-[#98989D] leading-relaxed mt-0.5">
                      Native desktop application with system tray notifications, offline background sync, global keyboard shortcuts, and mini widget view.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SHORTCUTS & HELP */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <div>
                <h4 className="text-[11px] font-semibold text-[#86868B] dark:text-[#98989D] uppercase tracking-wider mb-2">
                  Keyboard Shortcuts
                </h4>
                <div className="divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] rounded-xl overflow-hidden bg-white dark:bg-[#202022]">
                  {shortcuts.map((sc) => (
                    <div
                      key={sc.key}
                      className="flex items-center justify-between px-3 py-2 text-xs"
                    >
                      <span className="text-[#1D1D1F] dark:text-[#F5F5F7] font-normal">{sc.description}</span>
                      <kbd className="px-2 py-0.5 rounded bg-[#F5F5F7] dark:bg-[#28282A] border border-[#E5E5EA] dark:border-[#38383A] font-mono text-[11px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F5F5F7] dark:bg-[#242426] border border-[#E5E5EA] dark:border-[#38383A] flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-[#0A84FF] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Need assistance?</p>
                  <p className="text-[11px] text-[#86868B] dark:text-[#98989D] mt-0.5 leading-relaxed">
                    Dayli is designed to be fully navigable via keyboard and mouse. Click on any date cell or timeline row to immediately create an event. Use standard iCalendar (.ics) files to import from Google or Apple Calendar anytime.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F5F5F7]/40 dark:bg-[#1A1A1C] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-white dark:bg-[#28282A] border border-[#E5E5EA] dark:border-[#38383A] hover:bg-[#F5F5F7] dark:hover:bg-[#303034] font-medium text-xs text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
