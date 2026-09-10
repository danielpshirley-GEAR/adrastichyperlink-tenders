"use client";

import React, { useState } from "react";
import { FocusTask, Opportunity } from "@/lib/types";
import {
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Mail,
  Copy,
  Check,
  PhoneCall,
  Flame,
  CheckCircle2,
  Clock,
  ExternalLink,
  Ban,
  Bookmark,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";

interface FocusSessionModeProps {
  durationMinutes: number;
  tasks: FocusTask[];
  onClose: () => void;
  onCompleteTask: (taskId: string) => void;
  onOpenOutreach: (task: FocusTask) => void;
}

export function FocusSessionMode({
  durationMinutes,
  tasks,
  onClose,
  onCompleteTask,
  onOpenOutreach,
}: FocusSessionModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [stats, setStats] = useState({
    handled: 0,
    contacted: 0,
    nurtured: 0,
    rejected: 0,
  });

  if (tasks.length === 0) return null;

  const currentTask = tasks[currentIndex];
  const isLast = currentIndex === tasks.length - 1;

  const advanceOrFinish = (actionType: "complete" | "contacted" | "nurture" | "reject") => {
    onCompleteTask(currentTask.id);
    setStats((prev) => ({
      ...prev,
      handled: prev.handled + 1,
      contacted: actionType === "contacted" ? prev.contacted + 1 : prev.contacted,
      nurtured: actionType === "nurture" ? prev.nurtured + 1 : prev.nurtured,
      rejected: actionType === "reject" ? prev.rejected + 1 : prev.rejected,
    }));

    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(
      `Hi ${currentTask.buyerName.split(" ")[0]},\n\nI noticed you're ${currentTask.whyNow.toLowerCase()}. At Adrastichyperlink, we specialize in high-impact motion and brand design for scaleups and ambitious agencies.\n\nWould you be open to a brief 10-minute look at how we handled similar creative challenges?\n\nBest,\nDaniel Shirley\nCreative Director, Adrastichyperlink`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111116]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#e5e5eb] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#e5e5eb] bg-[#fafafb] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-sans px-2.5 py-1 rounded-md bg-[#111116] text-white font-extrabold uppercase tracking-wider">
              {durationMinutes}M FOCUS SPRINT
            </span>
            <span className="text-xs font-semibold text-[#6b6e7d]">
              TASK {currentIndex + 1} OF {tasks.length}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-[#6b6e7d] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ~{currentTask.estimatedMinutes} mins allotted
            </span>
            <button
              onClick={onClose}
              className="p-1 text-[#8e919f] hover:text-[#111116] rounded-lg hover:bg-[#e5e5eb] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {!sessionCompleted ? (
          <div className="p-8 overflow-y-auto space-y-6 flex-1">
            {/* Task Headline & Urgency */}
            <div className="flex items-start justify-between gap-4 border-b border-[#f1f1f5] pb-5">
              <div className="space-y-1">
                <span className="text-[10px] font-sans text-rose-600 uppercase font-bold tracking-wider">
                  {currentTask.engine.replace("_", " ")}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111116] tracking-tight">
                  {currentTask.companyName}
                </h2>
                <p className="text-sm font-semibold text-[#4a4d5a]">
                  {currentTask.opportunityTitle}
                </p>
              </div>

              <div className="text-right shrink-0 bg-[#fafafb] p-3 rounded-2xl border border-[#e5e5eb]">
                <div className="text-2xl font-mono font-extrabold text-rose-600">
                  {currentTask.actionScore}
                </div>
                <div className="text-[9px] font-sans uppercase font-bold text-[#8e919f]">
                  Action Score
                </div>
              </div>
            </div>

            {/* Target Buyer & Trigger */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#f8f8fa] rounded-2xl border border-[#e5e5eb] space-y-1">
                <span className="text-[10px] font-sans font-bold text-[#8e919f] uppercase tracking-wider block">
                  Target Decision Maker
                </span>
                <div className="text-sm font-bold text-[#111116]">
                  {currentTask.buyerName}
                </div>
                <div className="text-xs text-[#6b6e7d]">
                  {currentTask.buyerTitle}
                </div>
              </div>

              <div className="p-4 bg-[#f8f8fa] rounded-2xl border border-[#e5e5eb] space-y-1">
                <span className="text-[10px] font-sans font-bold text-[#8e919f] uppercase tracking-wider block">
                  Why Now (Trigger Evidence)
                </span>
                <div className="text-xs text-[#2b2b34] font-medium leading-relaxed">
                  {currentTask.whyNow}
                </div>
              </div>
            </div>

            {/* Recommended Approach */}
            <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-sans uppercase text-emerald-800 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Recommended Commercial Move
              </span>
              <p className="text-sm text-[#111116] leading-relaxed font-medium">
                {currentTask.suggestedAction}
              </p>
            </div>

            {/* Suggested Communication Draft */}
            <div className="p-5 bg-[#f8f8fa] border border-[#e5e5eb] rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans uppercase text-[#6b6e7d] font-bold">
                  Suggested Communication Draft
                </span>
                <button
                  onClick={handleCopyDraft}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Draft</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs font-mono text-[#2b2b34] bg-white p-3 rounded-xl border border-[#e5e5eb] leading-relaxed whitespace-pre-line">
                {`Hi ${currentTask.buyerName.split(" ")[0]}, noticed your search regarding ${currentTask.opportunityTitle.toLowerCase()}. At Adrastichyperlink, we direct senior 3D motion and brand transformations. Would you be open to seeing how we handled clinical robotics motion for similar scaleups?`}
              </p>
            </div>
          </div>
        ) : (
          /* Session Completed Summary (Section 43) */
          <div className="p-12 text-center space-y-6 flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-2xl font-extrabold text-[#111116]">
                Session Completed!
              </h3>
              <p className="text-sm text-[#6b6e7d]">
                Great work, Daniel. You have completed your customer acquisition focus sprint.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 max-w-lg w-full bg-[#f8f8fa] p-4 rounded-2xl border border-[#e5e5eb] text-center">
              <div>
                <div className="text-2xl font-bold font-mono text-[#111116]">
                  {stats.handled}
                </div>
                <div className="text-[10px] text-[#8e919f] font-sans uppercase">
                  Handled
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-emerald-600">
                  {stats.contacted}
                </div>
                <div className="text-[10px] text-[#8e919f] font-sans uppercase">
                  Contacted
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-sky-600">
                  {stats.nurtured}
                </div>
                <div className="text-[10px] text-[#8e919f] font-sans uppercase">
                  Nurtured
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-slate-500">
                  {stats.rejected}
                </div>
                <div className="text-[10px] text-[#8e919f] font-sans uppercase">
                  Rejected
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              Return to Workstation
            </button>
          </div>
        )}

        {/* Focus Controls Footer (Section 7 Action Buttons) */}
        {!sessionCompleted && (
          <div className="px-6 py-4 border-t border-[#e5e5eb] bg-[#fafafb] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => advanceOrFinish("reject")}
                className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => advanceOrFinish("nurture")}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-[#4a4d5a] border border-[#e5e5eb] rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Nurture</span>
              </button>
              <button
                onClick={() => {
                  if (!isLast) setCurrentIndex((p) => p + 1);
                }}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-[#4a4d5a] border border-[#e5e5eb] rounded-xl text-xs font-semibold transition-colors"
              >
                Skip
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenOutreach(currentTask)}
                className="px-4 py-2 bg-white hover:bg-[#f1f1f5] border border-[#e5e5eb] text-[#111116] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-rose-600" />
                <span>Review / Edit Draft</span>
              </button>
              <button
                onClick={() => advanceOrFinish("contacted")}
                className="px-5 py-2 bg-[#111116] hover:bg-[#23232c] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isLast ? "Finish & Complete" : "Contacted & Advance"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
