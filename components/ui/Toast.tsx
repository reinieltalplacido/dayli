'use client';

import React from 'react';
import { ToastNotification } from '@/types/calendar';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-[#E5E5EA] text-[#1D1D1F] text-xs font-medium transition-all transform animate-in fade-in slide-in-from-top-4 duration-200"
          role="status"
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0" />
          )}
          {toast.type === 'info' && (
            <Info className="w-4 h-4 text-[#0A84FF] shrink-0" />
          )}
          <span className="max-w-xs truncate">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-[#86868B] hover:text-[#1D1D1F] ml-1 p-0.5 rounded-full transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

