"use client";

import React, { useState, useEffect } from "react";
import { Edit2, Check, Target } from "lucide-react";
import { getUserSettingsAction, updateUserSettingsAction } from "@/app/actions/settings";

interface DailyFocusCardProps {
  initialFocus?: string;
}

export function DailyFocusCard({
  initialFocus = "Complete Q4 strategy roadmap and preserve afternoon for uninterrupted architecture work.",
}: DailyFocusCardProps) {
  const [focus, setFocus] = useState(initialFocus);
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(focus);

  useEffect(() => {
    async function loadFocus() {
      const res = await getUserSettingsAction();
      if (res.success && res.settings?.dailyFocus) {
        setFocus(res.settings.dailyFocus);
        setTempText(res.settings.dailyFocus);
      }
    }
    loadFocus();
  }, []);

  const handleSave = async () => {
    const textToSave = tempText.trim() || initialFocus;
    setFocus(textToSave);
    setIsEditing(false);
    await updateUserSettingsAction({ dailyFocus: textToSave });
  };

  return (
    <div className="p-5 rounded-xl border border-[#E4E8F0] bg-white shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#3457D5]" />
          <h3 className="font-editorial text-lg font-medium text-[#202536]">
            Primary Focus
          </h3>
        </div>
        {!isEditing ? (
          <button
            onClick={() => {
              setTempText(focus);
              setIsEditing(true);
            }}
            className="text-xs font-mono text-[#697386] hover:text-[#3457D5] flex items-center gap-1 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="text-xs font-mono text-[#3457D5] hover:text-[#263C9A] font-semibold flex items-center gap-1 transition-colors"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Save</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            rows={2}
            className="w-full text-sm p-2 rounded-lg border border-[#D3D8E2] bg-[#F7F8FC] text-[#202536] focus:ring-1 focus:ring-[#3457D5] focus:outline-none"
            placeholder="What is your singular priority today?"
          />
        </div>
      ) : (
        <p className="text-sm text-[#202536] leading-relaxed italic border-l-2 border-[#3457D5] pl-3 py-0.5">
          &ldquo;{focus}&rdquo;
        </p>
      )}

      <div className="pt-2 border-t border-[#E4E8F0] flex items-center justify-between text-xs text-[#697386]">
        <span>Guiding principle</span>
        <span className="font-mono">1 Intention</span>
      </div>
    </div>
  );
}
