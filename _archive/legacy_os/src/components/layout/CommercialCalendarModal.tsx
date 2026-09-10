"use client";

import React from "react";
import { X, Calendar, Clock, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

interface CommercialCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommercialCalendarModal({
  isOpen,
  onClose,
}: CommercialCalendarModalProps) {
  if (!isOpen) return null;

  const calendarEvents = [
    {
      date: "Today, 16:30",
      type: "Urgent Outreach",
      company: "Nexus Health Robotics",
      headline: "Send surgical 3D motion response to Sophie Tremblay (VP Marketing)",
      priority: "urgent",
    },
    {
      date: "Tomorrow, 10:00",
      type: "Follow-Up #1",
      company: "Verve & Co Creative",
      headline: "Step 2 follow-up regarding senior drinks motion capacity (Marcus Ward)",
      priority: "high",
    },
    {
      date: "Friday, 14:00",
      type: "Proposal Deadline",
      company: "Maison Saint-Honoré",
      headline: "Submit 3D interactive luxury campaign credentials",
      priority: "high",
    },
    {
      date: "In 6 Days",
      type: "Tender Review",
      company: "Department for Business & Trade (DBT)",
      headline: "Subcontracting outreach to prime agency partners (turnover barrier solo)",
      priority: "medium",
    },
    {
      date: "In 18 Days",
      type: "Tender Submission",
      company: "NHS Digital & ICB",
      headline: "Submit £45k Public Health Motion Framework tender response",
      priority: "high",
    },
    {
      date: "October 15",
      type: "Framework Opening",
      company: "Russell Group Universities (SUPC)",
      headline: "Digital Motion Preferred Supplier List opens for applications",
      priority: "medium",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div className="bg-white border border-[#e2e2ea] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-[#111116]">
        <div className="p-5 border-b border-[#e2e2ea] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#636375]" />
            <h2 className="text-base font-bold text-[#111116] tracking-tight studio-display">
              Commercial Activity Calendar (Section 51)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#636375] hover:text-[#111116] rounded-lg hover:bg-[#f4f4f7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {calendarEvents.map((evt, idx) => (
            <div
              key={idx}
              className="p-4 bg-[#fafafb] rounded-xl border border-[#e2e2ea] flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#111116]">{evt.company}</span>
                  <span className="text-[#8e919f]">•</span>
                  <span className="text-[10px] font-sans font-bold text-[#636375] uppercase">
                    {evt.type}
                  </span>
                </div>
                <p className="text-xs text-[#4b4e5d] leading-relaxed">{evt.headline}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold text-[#111116] block">
                  {evt.date}
                </span>
                <span
                  className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold inline-block mt-1 ${
                    evt.priority === "urgent"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : evt.priority === "high"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-slate-100 text-[#636375] border border-slate-200"
                  }`}
                >
                  {evt.priority}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#e2e2ea] bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#111116] text-white font-bold text-xs rounded-xl hover:bg-[#23232c] transition-colors shadow-xs"
          >
            Close Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
