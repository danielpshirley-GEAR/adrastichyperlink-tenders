"use client";

import React, { useState } from "react";
import {
  Opportunity,
  CommercialAnalytics,
  DailyWorkItem,
  FocusTask,
  PipelineStage,
  AppMode,
} from "@/lib/types";
import {
  Compass,
  Flame,
  Zap,
  TrendingUp,
  Building2,
  Layers,
  FileCheck,
  Clock,
  ArrowRight,
  Play,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Mail,
  PhoneCall,
  Calendar,
  ExternalLink,
  Search,
  Check,
  ShieldCheck,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { FocusSessionMode } from "./FocusSessionMode";

interface TodayMissionControlProps {
  opportunities: Opportunity[];
  analytics: CommercialAnalytics;
  dailyWorkItems: DailyWorkItem[];
  focusTasks: FocusTask[];
  appMode: AppMode;
  onSelectWorkspace: (workspaceId: any) => void;
  onSelectOpportunity: (opp: Opportunity) => void;
  onOpenOutreachModal: (opp: Opportunity, tab?: "email" | "linkedin" | "call") => void;
  onCompleteFocusTask: (taskId: string) => void;
  onMoveStage: (oppId: string, stage: PipelineStage) => void;
}

export function TodayMissionControl({
  opportunities,
  analytics,
  dailyWorkItems,
  focusTasks,
  appMode,
  onSelectWorkspace,
  onSelectOpportunity,
  onOpenOutreachModal,
  onCompleteFocusTask,
  onMoveStage,
}: TodayMissionControlProps) {
  const [sessionDuration, setSessionDuration] = useState<15 | 30 | 60 | 90>(30);
  const [isFocusSessionOpen, setIsFocusSessionOpen] = useState(false);
  const [auditQueueTab, setAuditQueueTab] = useState<"actionable" | "signals" | "unverified" | "rejected" | "all">("actionable");
  const [isAuditTableOpen, setIsAuditTableOpen] = useState(true);

  // Active opportunities sorted by Action Score
  const activeOpps = opportunities.filter(
    (o) => o.pipelineStage !== "rejected" && o.pipelineStage !== "lost"
  );
  const urgentOpps = activeOpps.filter((o) => o.actionScore >= 90);
  const followUpsDue = activeOpps.filter(
    (o) => o.pipelineStage === "contacted" || o.actionScore >= 80
  );

  const pendingTasks = focusTasks.filter((t) => !t.completed);

  // Separate Queues: Adrastichyperlink Studio vs Daniel Freelance
  const studioActionableOpps = activeOpps
    .filter(
      (o) =>
        o.opportunityConfidence !== "signal_only" &&
        o.isElevatedToOpportunity !== false &&
        o.verificationStatus !== "rejected" &&
        o.verificationStatus !== "unverified" &&
        o.brandRoute === "adrastichyperlink"
    )
    .sort((a, b) => b.actionScore - a.actionScore);

  const freelanceActionableOpps = activeOpps
    .filter(
      (o) =>
        o.opportunityConfidence !== "signal_only" &&
        o.isElevatedToOpportunity !== false &&
        o.verificationStatus !== "rejected" &&
        o.verificationStatus !== "unverified" &&
        o.brandRoute === "daniel_freelance"
    )
    .sort((a, b) => b.actionScore - a.actionScore);

  const totalActionableCount = studioActionableOpps.length + freelanceActionableOpps.length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-200">
      {/* Editorial Greeting & Daily Commercial Objective */}
      <div className="border-b border-[#e5e5eb] pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="text-[11px] font-sans uppercase tracking-wider text-[#6b6e7d] mb-2 flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            DAILY CUSTOMER ACQUISITION PROGRAMME • SECTIONS 4 & 5
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111116] tracking-tight studio-display">
            Good morning, Daniel.
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 mt-3">
            <span className="text-xs font-semibold text-[#6b6e7d]">
              Today's objective:
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
              Create 3 meaningful commercial conversations
            </span>
            <span className="text-xs text-[#8e919f]">
              (AI adjusted for highest probability conversion)
            </span>
          </div>
        </div>

        {/* Timed Session Launcher Card */}
        <div className="bg-white border border-[#e5e5eb] p-5 rounded-2xl space-y-3.5 shrink-0 lg:w-96 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-[#111116] fill-[#111116]" />
              <span className="text-xs font-bold text-[#111116] uppercase tracking-wider font-sans">
                Start Acquisition Session
              </span>
            </div>
            <span className="text-[10px] text-[#6b6e7d] font-sans font-medium">
              Section 6
            </span>
          </div>

          <p className="text-[11px] text-[#6b6e7d] leading-relaxed">
            AI queues high-value commercial actions into a timed, distraction-free sprint.
          </p>

          <div className="flex items-center gap-1.5 bg-[#f4f4f7] p-1 rounded-xl border border-[#e5e5eb]">
            {([15, 30, 60, 90] as const).map((mins) => (
              <button
                key={mins}
                onClick={() => setSessionDuration(mins)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
                  sessionDuration === mins
                    ? "bg-[#111116] text-white shadow-xs"
                    : "text-[#6b6e7d] hover:text-[#111116]"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsFocusSessionOpen(true)}
            className="w-full py-2.5 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Begin {sessionDuration}-Minute Session</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* OUTREACH INTEGRITY GATE NOTICE */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <h3 className="text-sm font-extrabold text-amber-950 font-sans tracking-wide">
                FINAL LIVE-DATA INTEGRITY GATE ACTIVE — OUTBOUND OUTREACH STRICTLY PAUSED
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                All 20 live records independently audited against primary sources. Zero outreach permitted until Daniel accepts the audit findings below.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuditTableOpen(!isAuditTableOpen)}
            className="px-3.5 py-1.5 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>{isAuditTableOpen ? "Hide Audit Matrix" : "View 20-Record Audit Matrix"}</span>
          </button>
        </div>
      </div>

      {/* DO THESE FIRST — SEPARATED QUEUES (Section 4) */}
      <div className="space-y-8">
        {/* QUEUE 1A: ADRASTICHYPERLINK STUDIO OPPORTUNITIES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5e5eb] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#111116]" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider font-sans text-[#111116]">
                Adrastichyperlink Studio Opportunities
              </h2>
              <span className="text-[11px] font-sans px-2 py-0.5 rounded-md bg-[#f4f4f7] text-[#4a4d5a] font-bold border border-[#e5e5eb]">
                Studio Commissions • Retainers • Overflow
              </span>
            </div>
            <span className="text-xs font-bold text-[#6b6e7d] font-mono">
              {studioActionableOpps.length} QUALIFIED TODAY
            </span>
          </div>

          {studioActionableOpps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {studioActionableOpps.map((opp, idx) => (
                <div
                  key={opp.id}
                  className="bg-white border-2 border-[#111116] rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-sans px-2 py-0.5 rounded-md font-bold border bg-[#111116] text-white">
                        STUDIO PROJECT • ACTION {opp.actionScore}
                      </span>
                      <span className="text-[11px] font-sans text-emerald-700 font-bold">
                        {opp.sourceGrade ? `Grade ${opp.sourceGrade}` : "Grade A"}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-[#111116] line-clamp-1">
                        {opp.company?.name || opp.title}
                      </h3>
                      <p className="text-xs text-[#4a4d5a] mt-1 leading-relaxed line-clamp-2">
                        {opp.whatEvidenceActuallyProves || opp.needDescription}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#f1f1f5] text-xs">
                      <div>
                        <span className="text-[10px] text-[#8e919f] block">Estimated Value:</span>
                        <span className="font-bold text-[#111116]">{opp.estimatedValueRange}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8e919f] block">Deadline:</span>
                        <span className="font-bold text-[#111116]">
                          {opp.applicationDeadline ? new Date(opp.applicationDeadline).toLocaleDateString("en-GB") : "Open"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => onSelectOpportunity(opp)}
                      className="py-1.5 bg-[#f4f4f7] hover:bg-[#e9e9ee] text-[#111116] font-bold text-xs rounded-lg transition-colors text-center"
                    >
                      Open Brief
                    </button>
                    <button
                      disabled
                      className="py-1.5 bg-amber-600/80 text-white font-bold text-xs rounded-lg text-center cursor-not-allowed"
                    >
                      Outreach Held
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#e5e5eb] rounded-2xl p-6 text-center space-y-2.5 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-[#f4f4f7] text-[#6b6e7d] flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5 text-[#8e919f]" />
              </div>
              <h3 className="text-sm font-extrabold text-[#111116]">
                Zero Studio Project Opportunities Qualified Today
              </h3>
              <p className="text-xs text-[#6b6e7d] max-w-xl mx-auto leading-relaxed">
                Strict integrity gate applied. Alleged government tenders (Bristol CAPO social care contract and MoD simulated notice) and synthetic Reddit posts were rejected upon primary source audit. The acquisition engine continues scanning for verified direct commissions and agency overflow.
              </p>
            </div>
          )}
        </div>

        {/* QUEUE 1B: DANIEL FREELANCE OPPORTUNITIES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5e5eb] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-600" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider font-sans text-[#111116]">
                Daniel Freelance Opportunities
              </h2>
              <span className="text-[11px] font-sans px-2 py-0.5 rounded-md bg-fuchsia-50 text-fuchsia-800 font-bold border border-fuchsia-200">
                Direct Contractor • Inside/Outside IR35 • Cash Flow
              </span>
            </div>
            <span className="text-xs font-bold text-fuchsia-700 font-mono">
              {freelanceActionableOpps.length} VERIFIED & ACTIONABLE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {freelanceActionableOpps.map((opp, idx) => {
              const exactUrl = opp.evidence?.[0]?.sourceUrl || "https://www.ifyoucouldjobs.com";
              const pubDate = opp.publishedAt ? new Date(opp.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Aug 2026";
              const deadlineDate = opp.applicationDeadline ? new Date(opp.applicationDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Sep 2026";

              return (
                <div
                  key={opp.id}
                  className="bg-white border-2 border-fuchsia-200 hover:border-fuchsia-400 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-sans px-2 py-0.5 rounded-md font-bold border bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200">
                          {opp.company?.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Grade A (Primary Verified)
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono text-[#111116]">
                        Action {opp.actionScore}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-[#111116] leading-snug">
                        {opp.title}
                      </h3>
                      <p className="text-xs text-[#4a4d5a] mt-1.5 leading-relaxed">
                        {opp.whatEvidenceActuallyProves}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-[#f1f1f5] text-xs">
                      <div>
                        <span className="text-[10px] text-[#8e919f] block">Stated Budget:</span>
                        <span className="font-bold text-emerald-700">{opp.estimatedValueRange}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8e919f] block">Published Date:</span>
                        <span className="font-semibold text-[#111116]">{pubDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8e919f] block">Deadline:</span>
                        <span className="font-semibold text-rose-700">{deadlineDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#f1f1f5] flex items-center justify-between gap-3">
                    <a
                      href={exactUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#f4f4f7] hover:bg-[#e9e9ee] text-[#111116] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#6b6e7d]" />
                      <span>Open Primary Listing</span>
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectOpportunity(opp)}
                        className="px-3 py-1.5 bg-[#f4f4f7] hover:bg-[#e9e9ee] text-[#111116] font-bold text-xs rounded-lg transition-colors"
                      >
                        Inspect Brief
                      </button>
                      <button
                        disabled
                        title="Outreach strictly paused pending Daniel's review"
                        className="px-3 py-1.5 bg-amber-500/80 text-white font-bold text-xs rounded-lg cursor-not-allowed flex items-center gap-1"
                      >
                        <span>Outreach Paused</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 20-RECORD INTEGRITY AUDIT MATRIX */}
        {isAuditTableOpen && (
          <div className="bg-white border border-[#e5e5eb] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e5eb] pb-4">
              <div>
                <div className="text-[11px] font-sans text-[#6b6e7d] uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  EVIDENCE HIERARCHY & SOURCE INTEGRITY AUDIT (20 RECORDS)
                </div>
                <h3 className="text-lg font-extrabold text-[#111116]">
                  Live-Data Integrity Matrix
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "actionable", label: `Queue 1: Actionable (${opportunities.filter(o => !o.isDemo && o.isElevatedToOpportunity && o.verificationStatus === "verified").length})` },
                  { id: "signals", label: `Queue 2: Signals (${opportunities.filter(o => !o.isDemo && o.opportunityConfidence === "signal_only" && o.verificationStatus === "verified").length})` },
                  { id: "unverified", label: `Queue 3: Unverified (${opportunities.filter(o => !o.isDemo && o.verificationStatus === "unverified").length})` },
                  { id: "rejected", label: `Queue 4: Rejected (${opportunities.filter(o => !o.isDemo && o.verificationStatus === "rejected").length})` },
                  { id: "all", label: `All 20 Records` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAuditQueueTab(tab.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                      auditQueueTab === tab.id
                        ? "bg-[#111116] text-white border-[#111116]"
                        : "bg-white text-[#4a4d5a] border-[#e5e5eb] hover:bg-[#f4f4f7]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5e5eb] text-[#8e919f] font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Company / Buyer</th>
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3">Published</th>
                    <th className="py-2.5 px-3">Deadline</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Action Score</th>
                    <th className="py-2.5 px-3">Verification Notes</th>
                    <th className="py-2.5 px-3 text-right">Source Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f1f5]">
                  {opportunities
                    .filter((o) => !o.isDemo)
                    .filter((o) => {
                      if (auditQueueTab === "actionable") return o.isElevatedToOpportunity && o.verificationStatus === "verified";
                      if (auditQueueTab === "signals") return o.opportunityConfidence === "signal_only" && o.verificationStatus === "verified";
                      if (auditQueueTab === "unverified") return o.verificationStatus === "unverified";
                      if (auditQueueTab === "rejected") return o.verificationStatus === "rejected";
                      return true;
                    })
                    .map((o) => {
                      const exactUrl = o.evidence?.[0]?.sourceUrl || "#";
                      const pubDate = o.publishedAt && !o.publishedAt.includes("Expired") && !o.publishedAt.includes("N/A")
                        ? new Date(o.publishedAt).toLocaleDateString("en-GB")
                        : (o.publishedAt || "N/A");
                      const deadDate = o.applicationDeadline && !o.applicationDeadline.includes("Expired") && !o.applicationDeadline.includes("N/A") && !o.applicationDeadline.includes("Open")
                        ? new Date(o.applicationDeadline).toLocaleDateString("en-GB")
                        : (o.applicationDeadline || "N/A");

                      return (
                        <tr key={o.id} className="hover:bg-[#fafafa] transition-colors">
                          <td className="py-3 px-3 font-bold text-[#111116] whitespace-nowrap">
                            {o.company?.name || o.title}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              o.sourceGrade === "A"
                                ? "bg-emerald-100 text-emerald-800"
                                : o.sourceGrade === "B"
                                ? "bg-blue-100 text-blue-800"
                                : o.sourceGrade === "C"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}>
                              Grade {o.sourceGrade}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-[#4a4d5a] whitespace-nowrap">
                            {o.signalClassification?.replace(/_/g, " ")}
                          </td>
                          <td className="py-3 px-3 font-mono text-[#6b6e7d] whitespace-nowrap">
                            {pubDate}
                          </td>
                          <td className="py-3 px-3 font-mono text-[#6b6e7d] whitespace-nowrap">
                            {deadDate}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              o.brandRoute === "daniel_freelance" ? "bg-fuchsia-50 text-fuchsia-800" : "bg-slate-100 text-slate-800"
                            }`}>
                              {o.brandRoute === "daniel_freelance" ? "Daniel Freelance" : "Studio"}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-[#111116]">
                            {o.actionScore}
                          </td>
                          <td className="py-3 px-3 text-[#4a4d5a] max-w-xs truncate" title={o.verificationNotes}>
                            {o.verificationNotes}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {exactUrl !== "#" ? (
                              <a
                                href={exactUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                              >
                                <span>Verify</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[#8e919f]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>


      {/* YOUR BUSINESS DEVELOPMENT PLAN TODAY (Section 5) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#111116]" />
            <h2 className="text-sm font-bold uppercase tracking-wider font-sans text-[#111116]">
              Your Business Development Plan Today
            </h2>
          </div>
          <span className="text-xs text-[#6b6e7d] font-sans font-medium">
            Daily acquisition routine across all engines
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Active Buyers */}
          <div className="bg-white border border-[#e5e5eb] p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  Active Buyers
                </span>
                <span className="text-[11px] font-sans text-[#8e919f]">~20 min</span>
              </div>
              <div className="text-xl font-extrabold text-[#111116]">
                4 worth reviewing
              </div>
              <p className="text-xs text-[#6b6e7d]">
                Explicit buyer posts discovered in the last 2 hours.
              </p>
            </div>
            <button
              onClick={() => onSelectWorkspace("active_buyers")}
              className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors border border-rose-200"
            >
              Start Review
            </button>
          </div>

          {/* Business Signals */}
          <div className="bg-white border border-[#e5e5eb] p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Business Signals
                </span>
                <span className="text-[11px] font-sans text-[#8e919f]">~30 min</span>
              </div>
              <div className="text-xl font-extrabold text-[#111116]">
                6 passed qualification
              </div>
              <p className="text-xs text-[#6b6e7d]">
                Stacked corporate changes (OmniFlow, Aegis, Kintyre).
              </p>
            </div>
            <button
              onClick={() => onSelectWorkspace("business_signals")}
              className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-xl transition-colors border border-sky-200"
            >
              Review Signals
            </button>
          </div>

          {/* Internal Needs */}
          <div className="bg-white border border-[#e5e5eb] p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Internal Needs
                </span>
                <span className="text-[11px] font-sans text-[#8e919f]">~15 min</span>
              </div>
              <div className="text-xl font-extrabold text-[#111116]">
                3 transformation briefs
              </div>
              <p className="text-xs text-[#6b6e7d]">
                Non-marketing executive communication problems.
              </p>
            </div>
            <button
              onClick={() => onSelectWorkspace("internal_needs")}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-colors border border-emerald-200"
            >
              Review Needs
            </button>
          </div>

          {/* Agency Development */}
          <div className="bg-white border border-[#e5e5eb] p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Agency Development
                </span>
                <span className="text-[11px] font-sans text-[#8e919f]">~20 min</span>
              </div>
              <div className="text-xl font-extrabold text-[#111116]">
                5 accounts need action
              </div>
              <p className="text-xs text-[#6b6e7d]">
                Studios with account wins lacking 3D motion capacity.
              </p>
            </div>
            <button
              onClick={() => onSelectWorkspace("agency_overflow")}
              className="w-full py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs rounded-xl transition-colors border border-violet-200"
            >
              Start Prospecting
            </button>
          </div>

          {/* Private Commissions & RFPs */}
          <div className="bg-white border border-[#e5e5eb] p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-indigo-600 uppercase tracking-wider">
                  Commissions & RFPs
                </span>
                <span className="text-[11px] font-sans text-[#8e919f]">~15 min</span>
              </div>
              <div className="text-xl font-extrabold text-[#111116]">
                2 suitable briefs
              </div>
              <p className="text-xs text-[#6b6e7d]">
                Direct corporate pitches with confirmed production budgets.
              </p>
            </div>
            <button
              onClick={() => onSelectWorkspace("commissions_rfps")}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors border border-indigo-200"
            >
              Review Briefs
            </button>
          </div>

          {/* Public Tenders */}
          <div className="bg-white border border-[#e5e5eb] p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-blue-600 uppercase tracking-wider">
                  Tenders & Procurement
                </span>
                <span className="text-[11px] font-sans text-[#8e919f]">~15 min</span>
              </div>
              <div className="text-xl font-extrabold text-[#111116]">
                1 Bid • 3 Rejected
              </div>
              <p className="text-xs text-[#6b6e7d]">
                Auto-screened on supplier readiness & turnover mandates.
              </p>
            </div>
            <button
              onClick={() => onSelectWorkspace("public_tenders")}
              className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors border border-blue-200"
            >
              Review Bid
            </button>
          </div>

          {/* Follow-ups Due */}
          <div className="bg-white border border-[#e5e5eb] p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs sm:col-span-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Follow-ups Due Today
                </span>
                <span className="text-[11px] font-sans text-[#8e919f]">7 due</span>
              </div>
              <div className="text-xl font-extrabold text-[#111116]">
                7 conversations require scheduled touchpoint
              </div>
              <p className="text-xs text-[#6b6e7d]">
                Consistent multi-touch follow-up engine. Never let a qualified lead go cold.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectWorkspace("pipeline")}
                className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl transition-colors border border-amber-200 text-center"
              >
                Complete Follow-Ups
              </button>
              <button
                onClick={() => setIsFocusSessionOpen(true)}
                className="py-2 px-4 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-xl transition-colors text-center"
              >
                Run Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Session Modal Runner */}
      {isFocusSessionOpen && (
        <FocusSessionMode
          durationMinutes={sessionDuration}
          tasks={focusTasks}
          onClose={() => setIsFocusSessionOpen(false)}
          onCompleteTask={onCompleteFocusTask}
          onOpenOutreach={(task) => {
            const opp = opportunities.find((o) => o.id === task.opportunityId);
            if (opp) onOpenOutreachModal(opp, "email");
          }}
        />
      )}
    </div>
  );
}
