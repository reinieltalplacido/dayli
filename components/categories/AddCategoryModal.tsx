'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CATEGORY_COLOR_PRESETS } from '@/lib/constants';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (name: string, color: string, lightBg: string) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onAddCategory,
}) => {
  const [name, setName] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }

    const preset = CATEGORY_COLOR_PRESETS[selectedColorIndex];
    onAddCategory(name.trim(), preset.color, preset.lightBg);
    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[4px] animate-backdrop">
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#1C1C1E] shadow-2xl border border-[#E5E5EA] dark:border-[#38383A] overflow-hidden text-[#1D1D1F] dark:text-[#F5F5F7] animate-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
          <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">New Calendar</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#86868B] dark:text-[#98989D] mb-1.5">
              Calendar Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Health, Projects, Travel"
              autoFocus
              className="w-full px-3 py-1.5 text-sm rounded-md border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B]/60 dark:placeholder-[#98989D]/60 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF] transition-all"
            />
            {error && <p className="text-xs text-[#FF3B30] mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#86868B] dark:text-[#98989D] mb-2">
              Color Label
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORY_COLOR_PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setSelectedColorIndex(idx)}
                  className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs transition-all ${
                    selectedColorIndex === idx
                      ? 'border-[#0A84FF] bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20 font-medium text-[#1D1D1F] dark:text-[#F5F5F7]'
                      : 'border-[#E5E5EA] dark:border-[#38383A] hover:bg-[#F5F5F7] dark:hover:bg-[#28282A] text-[#1D1D1F] dark:text-[#F5F5F7]'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span className="truncate text-[11px]">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#0A84FF] hover:bg-[#0071E3] rounded-md shadow-sm transition-colors"
            >
              Add Calendar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
