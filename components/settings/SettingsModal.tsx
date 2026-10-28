'use client';

import React, { useState } from 'react';
import { X, RefreshCw, Download, Upload, Trash2, Check } from 'lucide-react';
import { DayliLogo } from '../ui/DayliLogo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  onClearData: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  onClearData,
  onExportData,
  onImportData,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);

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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[2px] animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E5E5EA] overflow-hidden text-[#1D1D1F] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-2">
            <DayliLogo size={22} />
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Preferences & Data</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* About */}
          <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-[#1D1D1F]">Dayli 1.0</span>
              <span className="text-[10px] font-semibold text-[#0A84FF] bg-[#0A84FF]/10 px-2 py-0.5 rounded-full">
                Phase 1 Active
              </span>
            </div>
            <p className="text-[#86868B] leading-relaxed">
              Designed with Dayli’s design philosophy: focused calm, subtle borders,
              precise typography, and local-first persistence.
            </p>
          </div>

          {/* Import / Export */}
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

          {/* Data Management */}
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
