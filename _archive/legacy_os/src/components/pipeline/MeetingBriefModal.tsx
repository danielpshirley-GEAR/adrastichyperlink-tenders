"use client";

import React from "react";
import { Opportunity } from "@/lib/types";
import { X, Calendar, CheckSquare, AlertTriangle, ArrowRight, Copy, Check } from "lucide-react";

interface MeetingBriefModalProps {
  opportunity: Opportunity;
  onClose: () => void;
}

export function MeetingBriefModal({
  opportunity,
  onClose,
}: MeetingBriefModalProps) {
  const brief = opportunity.meetingBrief;
  const [copied, setCopied] = React.useState(false);

  const diagnosticQuestions = brief?.diagnosticQuestions || [
    "What is happening across the organisation that made this a priority right now?",
    "What needs improving specifically compared to your current visual presentation?",
    "What is the single most critical commercial outcome this project must achieve?",
    "Who else on the executive team or board needs to sign off on creative direction?",
    "What happens to your launch timetable if this creative work does not happen in Q4?",
  ];

  const handleCopy = () => {
    const text = `ADRASTICHYPERLINK MEETING BRIEF: ${opportunity.company?.name}\n\nTRIGGER: ${opportunity.trigger}\nBUYER: ${opportunity.primaryContact?.name} (${opportunity.primaryContact?.jobTitle})\n\nKEY DIAGNOSTIC QUESTIONS:\n${diagnosticQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nDESIRED NEXT STEP: Agree on discovery scope & schedule 3-point creative proposal review.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#e2e2ea] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-[#111116]">
        {/* Header */}
        <div className="p-5 border-b border-[#e2e2ea] flex items-center justify-between bg-white">
          <div>
            <div className="text-[10px] font-sans text-[#636375] uppercase flex items-center gap-1.5 font-bold tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              1-PAGE EXECUTIVE MEETING BRIEF (SECTION 25)
            </div>
            <h2 className="text-xl font-bold text-[#111116] tracking-tight mt-0.5 studio-display">
              {opportunity.company?.name} — Discovery Call Plan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#636375] hover:text-[#111116] rounded-lg hover:bg-[#f4f4f7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Top Context Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#fafafb] p-4 rounded-xl border border-[#e2e2ea] space-y-1">
              <span className="font-sans text-[#636375] uppercase text-[10px] font-bold tracking-wider">
                Target Buyer
              </span>
              <div className="text-[#111116] font-bold text-sm">
                {opportunity.primaryContact?.name || "Direct Lead"}
              </div>
              <div className="text-[#636375] text-[11px] font-medium">
                {opportunity.primaryContact?.jobTitle}
              </div>
            </div>

            <div className="bg-[#fafafb] p-4 rounded-xl border border-[#e2e2ea] space-y-1">
              <span className="font-sans text-[#636375] uppercase text-[10px] font-bold tracking-wider">
                Opportunity Value
              </span>
              <div className="text-emerald-700 font-bold font-mono text-sm">
                {opportunity.estimatedValueRange}
              </div>
              <div className="text-[#636375] text-[11px] capitalize font-medium">
                {opportunity.recommendedEngagement.replace("_", " ")}
              </div>
            </div>
          </div>

          {/* Business Problem */}
          <div className="space-y-1.5">
            <span className="font-sans text-[#636375] uppercase text-[10px] font-bold tracking-wider">
              Observed Business Problem & Trigger
            </span>
            <div className="bg-[#fafafb] p-4 rounded-xl border border-[#e2e2ea] text-[#111116] leading-relaxed">
              {brief?.companySummary || opportunity.needDescription}
            </div>
          </div>

          {/* Strategic Diagnostic Questions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[#636375] uppercase text-[10px] font-bold tracking-wider">
                Strategic Diagnostic Questions (Diagnose Before Scope)
              </span>
              <span className="text-[10px] font-sans text-[#8e919f]">
                Section 25 Framework
              </span>
            </div>

            <div className="space-y-2">
              {diagnosticQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#fafafb] rounded-xl border border-[#e2e2ea] text-[#111116] flex items-start gap-3"
                >
                  <span className="font-mono text-amber-700 font-bold text-xs">
                    0{idx + 1}.
                  </span>
                  <span className="leading-relaxed font-sans">{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Defined Next Step */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <div className="text-[10px] font-sans uppercase text-emerald-800 font-bold flex items-center gap-1.5 tracking-wider">
              <ArrowRight className="w-3.5 h-3.5" />
              Required Call Ending Rule
            </div>
            <div className="text-xs text-emerald-950 font-medium leading-relaxed">
              End the call with a defined next step: Lock date for presenting the 1 recommended scope solution. Never leave the meeting with "we'll send some thoughts over."
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e2e2ea] bg-white flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-[#fafafb] hover:bg-[#f0f0f4] text-[#111116] border border-[#e2e2ea] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-[#636375]" />}
            <span>{copied ? "Copied Brief" : "Copy Brief to Clipboard"}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#111116] text-white hover:bg-[#23232c] text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            Close Brief
          </button>
        </div>
      </div>
    </div>
  );
}
