'use client';

import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Check,
  Moon,
  Sun,
  Sliders,
  Database,
  HelpCircle,
  Command,
} from 'lucide-react';
import { DayliLogo } from '../ui/DayliLogo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  onClearData: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => boolean;
  initialTab?: 'general' | 'data' | 'shortcuts';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  onClearData,
  onExportData,
  onImportData,
  initialTab = 'general',
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'shortcuts'>(initialTab);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'system' | 'dark'>('light');
  const [weekStartsOn, setWeekStartsOn] = useState<'sunday' | 'monday'>('sunday');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = onImportData(content);
      if (success) {
        setImportStatus('Events imported successfully!');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Failed to import: invalid JSON format');
      }
    };
    reader.readAsText(file);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E5E5EA] overflow-hidden text-[#1D1D1F] flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-2">
            <DayliLogo size={22} />
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Preferences & Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#E5E5EA] bg-[#F5F5F7]/30">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'general'
                ? 'border-[#0A84FF] text-[#0A84FF]'
                : 'border-transparent text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>General</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'data'
                ? 'border-[#0A84FF] text-[#0A84FF]'
                : 'border-transparent text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data & Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'shortcuts'
                ? 'border-[#0A84FF] text-[#0A84FF]'
                : 'border-transparent text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <Command className="w-3.5 h-3.5" />
            <span>Shortcuts & Help</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Appearance / Theme */}
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Appearance
                </label>
                <p className="text-[11px] text-[#86868B] mb-2.5">
                  Select your interface color theme
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTheme('light')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                      selectedTheme === 'light'
                        ? 'border-[#0A84FF] bg-[#0A84FF]/5 shadow-xs font-medium'
                        : 'border-[#E5E5EA] hover:bg-[#F5F5F7]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-white border border-[#E5E5EA] flex items-center justify-center text-[#FF9500]">
                      <Sun className="w-4 h-4" />
                    </div>
                    <span className="text-xs">Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTheme('system')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                      selectedTheme === 'system'
                        ? 'border-[#0A84FF] bg-[#0A84FF]/5 shadow-xs font-medium'
                        : 'border-[#E5E5EA] hover:bg-[#F5F5F7]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <span className="text-xs">System</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                      selectedTheme === 'dark'
                        ? 'border-[#0A84FF] bg-[#0A84FF]/5 shadow-xs font-medium'
                        : 'border-[#E5E5EA] hover:bg-[#F5F5F7]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center">
                      <Moon className="w-4 h-4 text-[#0A84FF]" />
                    </div>
                    <span className="text-xs">Dark (Preview)</span>
                  </button>
                </div>
              </div>

              {/* Week Start */}
              <div className="pt-2 border-t border-[#E5E5EA]">
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Start of Week
                </label>
                <p className="text-[11px] text-[#86868B] mb-2">
                  Choose which day begins the weekly schedule
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWeekStartsOn('sunday')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      weekStartsOn === 'sunday'
                        ? 'border-[#0A84FF] bg-[#0A84FF]/5 text-[#0A84FF]'
                        : 'border-[#E5E5EA] hover:bg-[#F5F5F7] text-[#1D1D1F]'
                    }`}
                  >
                    Sunday
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekStartsOn('monday')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      weekStartsOn === 'monday'
                        ? 'border-[#0A84FF] bg-[#0A84FF]/5 text-[#0A84FF]'
                        : 'border-[#E5E5EA] hover:bg-[#F5F5F7] text-[#1D1D1F]'
                    }`}
                  >
                    Monday
                  </button>
                </div>
              </div>

              {/* About card */}
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#1D1D1F]">Dayli v1.0</span>
                  <span className="text-[10px] font-semibold text-[#0A84FF] bg-[#0A84FF]/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-[#86868B] leading-relaxed">
                  Fast, focused personal calendar & task workspace with local persistence and cloud sync ready.
                </p>
              </div>
            </div>
          )}

          {/* DATA TAB */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-2">
                  Backup & Portability
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onExportData}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#E5E5EA] hover:bg-[#F5F5F7] font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0A84FF]" />
                    <span>Export JSON</span>
                  </button>

                  <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#E5E5EA] hover:bg-[#F5F5F7] font-medium transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#34C759]" />
                    <span>Import JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {importStatus && (
                  <p className="text-[11px] text-[#0A84FF] mt-1.5 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>{importStatus}</span>
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-2">
                  Data Management
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onResetData();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E5E5EA] hover:bg-[#F5F5F7] text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#0A84FF]" />
                      <div>
                        <p className="font-medium text-[#1D1D1F]">Restore Sample Schedule</p>
                        <p className="text-[11px] text-[#86868B]">
                          Reload realistic sample events and tasks
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all calendar data?')) {
                        onClearData();
                        onClose();
                      }
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#FF3B30]/30 hover:bg-[#FF3B30]/10 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-[#FF3B30]" />
                      <div>
                        <p className="font-medium text-[#FF3B30]">Clear All Data</p>
                        <p className="text-[11px] text-[#86868B]">
                          Wipe local storage events and tasks
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SHORTCUTS & HELP TAB */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <div>
                <h4 className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-2">
                  Keyboard Shortcuts
                </h4>
                <div className="divide-y divide-[#E5E5EA] border border-[#E5E5EA] rounded-xl overflow-hidden bg-white">
                  {shortcuts.map((sc) => (
                    <div
                      key={sc.key}
                      className="flex items-center justify-between px-3 py-2 text-xs"
                    >
                      <span className="text-[#1D1D1F] font-normal">{sc.description}</span>
                      <kbd className="px-2 py-0.5 rounded bg-[#F5F5F7] border border-[#E5E5EA] font-mono text-[11px] font-semibold text-[#1D1D1F]">
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-[#0A84FF] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#1D1D1F]">Need assistance?</p>
                  <p className="text-[11px] text-[#86868B] mt-0.5 leading-relaxed">
                    Dayli is designed to be fully navigable via keyboard and mouse. You can quickly add events by clicking any time slot or day cell.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E5E5EA] bg-[#F5F5F7]/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] font-medium text-xs text-[#1D1D1F] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
