"use client";

import React, { useState } from "react";
import { Opportunity, PipelineStage, LeadFeedback } from "@/lib/types";
import {
  Flame,
  Search,
  ExternalLink,
  Clock,
  Mail,
  PhoneCall,
  Sparkles,
  Zap,
  CheckCircle2,
  Share2,
  Building2,
  DollarSign,
  ShieldCheck,
  Check,
  Ban,
  ArrowRight,
  Eye,
  Copy,
  Calendar,
  MessageSquare,
} from "lucide-react";

interface ActiveBuyersWorkspaceProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onOpenOutreachModal: (opp: Opportunity, tab?: "email" | "linkedin" | "call") => void;
  onMoveStage?: (oppId: string, stage: PipelineStage) => void;
  onFeedback?: (oppId: string, feedback: LeadFeedback) => void;
}

const FEEDBACK_OPTIONS: {
  id: LeadFeedback;
  label: string;
  color: string;
  activeColor: string;
  tag: string;
}[] = [
  {
    id: "excellent",
    label: "Excellent",
    color: "hover:border-emerald-500 hover:text-emerald-700 bg-white text-emerald-800 border-emerald-200",
    activeColor: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
    tag: "High Priority",
  },
  {
    id: "relevant",
    label: "Relevant",
    color: "hover:border-blue-500 hover:text-blue-700 bg-white text-blue-800 border-blue-200",
    activeColor: "bg-blue-600 text-white border-blue-600 shadow-sm",
    tag: "Target Lead",
  },
  {
    id: "weak",
    label: "Weak",
    color: "hover:border-amber-500 hover:text-amber-700 bg-white text-amber-800 border-amber-200",
    activeColor: "bg-amber-600 text-white border-amber-600 shadow-sm",
    tag: "Low Confidence",
  },
  {
    id: "wrong",
    label: "Wrong",
    color: "hover:border-rose-500 hover:text-rose-700 bg-white text-rose-800 border-rose-200",
    activeColor: "bg-rose-600 text-white border-rose-600 shadow-sm",
    tag: "Disqualified",
  },
  {
    id: "no_budget",
    label: "No Budget",
    color: "hover:border-purple-500 hover:text-purple-700 bg-white text-purple-800 border-purple-200",
    activeColor: "bg-purple-600 text-white border-purple-600 shadow-sm",
    tag: "Commercial Mismatch",
  },
  {
    id: "wrong_buyer",
    label: "Wrong Buyer",
    color: "hover:border-orange-500 hover:text-orange-700 bg-white text-orange-800 border-orange-200",
    activeColor: "bg-orange-600 text-white border-orange-600 shadow-sm",
    tag: "Wrong Contact",
  },
  {
    id: "too_old",
    label: "Too Old",
    color: "hover:border-slate-500 hover:text-slate-700 bg-white text-slate-700 border-slate-200",
    activeColor: "bg-slate-700 text-white border-slate-700 shadow-sm",
    tag: "Expired Timing",
  },
  {
    id: "not_our_work",
    label: "Not Our Work",
    color: "hover:border-stone-500 hover:text-stone-700 bg-white text-stone-700 border-stone-200",
    activeColor: "bg-stone-800 text-white border-stone-800 shadow-sm",
    tag: "Out of Scope",
  },
];

export function ActiveBuyersWorkspace({
  opportunities,
  onSelectOpportunity,
  onOpenOutreachModal,
  onMoveStage,
  onFeedback,
}: ActiveBuyersWorkspaceProps) {
  const [filterTab, setFilterTab] = useState<
    "all" | "live" | "today" | "3d" | "qualified" | "contacted" | "watching" | "rejected"
  >("live");

  const [activeOutreachTab, setActiveOutreachTab] = useState<"email" | "linkedin" | "call" | "schedule">("email");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const buyerOpps = opportunities.filter(
    (o) => o.acquisitionEngine === "active_demand"
  );

  const filteredOpps = buyerOpps.filter((opp) => {
    if (filterTab === "live") return opp.triggerFreshnessHours <= 2;
    if (filterTab === "today") return opp.triggerFreshnessHours <= 24;
    if (filterTab === "3d") return opp.triggerFreshnessHours <= 72;
    if (filterTab === "qualified") return opp.leadScore >= 85;
    if (filterTab === "contacted") return opp.pipelineStage === "contacted";
    if (filterTab === "watching") return opp.pipelineStage === "researched";
    if (filterTab === "rejected") return opp.pipelineStage === "rejected";
    return true;
  });

  const [selectedOppId, setSelectedOppId] = useState<string>(
    filteredOpps[0]?.id || buyerOpps[0]?.id || ""
  );

  const activeOpp =
    buyerOpps.find((o) => o.id === selectedOppId) || filteredOpps[0] || buyerOpps[0];

  const originalPost =
    activeOpp?.evidence.find((e) => e.category === "post" || e.category === "rfp") ||
    activeOpp?.evidence[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-rose-600 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Flame className="w-3.5 h-3.5" />
            ENGINE 1 • ACTIVE BUYERS (REAL SOURCES & DANIEL CALIBRATION)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Active Buyers
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            People and studios actively searching for motion, 3D, and design partners now.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            {buyerOpps.length} verified buyer requirements found in the last 72 hours. High-speed response is critical: respond within 1–2 hours of signal detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>Scanning: If You Could Jobs, Reddit Design Boards, Contracts Finder UK</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#e5e5eb] pb-3">
        {(
          [
            { id: "live", label: "LIVE (<2h)" },
            { id: "today", label: "TODAY (<24h)" },
            { id: "3d", label: "LAST 3 DAYS" },
            { id: "qualified", label: "QUALIFIED (85+)" },
            { id: "contacted", label: "CONTACTED" },
            { id: "watching", label: "WATCHING" },
            { id: "rejected", label: "DISQUALIFIED" },
            { id: "all", label: `ALL SIGNALS (${buyerOpps.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setFilterTab(t.id);
              const matching = buyerOpps.filter((opp) => {
                if (t.id === "live") return opp.triggerFreshnessHours <= 2;
                if (t.id === "today") return opp.triggerFreshnessHours <= 24;
                if (t.id === "3d") return opp.triggerFreshnessHours <= 72;
                if (t.id === "qualified") return opp.leadScore >= 85;
                if (t.id === "contacted") return opp.pipelineStage === "contacted";
                if (t.id === "watching") return opp.pipelineStage === "researched";
                if (t.id === "rejected") return opp.pipelineStage === "rejected";
                return true;
              });
              if (matching.length > 0) setSelectedOppId(matching[0].id);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
              filterTab === t.id
                ? "bg-[#111116] text-white shadow-xs"
                : "text-[#6b6e7d] hover:text-[#111116] bg-[#f4f4f7]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 3-Pane High-Density Acquisition Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: List of Opportunities (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          {filteredOpps.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#e5e5eb] rounded-2xl text-xs text-[#6b6e7d]">
              No buyer signals in this view. Switch to "ALL SIGNALS" or "LAST 3 DAYS".
            </div>
          ) : (
            filteredOpps.map((opp) => {
              const isSelected = opp.id === activeOpp?.id;
              const isUrgent = opp.triggerFreshnessHours <= 2;
              const currentFeedback = opp.feedback
                ? FEEDBACK_OPTIONS.find((f) => f.id === opp.feedback)
                : null;

              return (
                <div
                  key={opp.id}
                  onClick={() => setSelectedOppId(opp.id)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-white border-rose-500 shadow-md ring-1 ring-rose-500/20"
                      : "bg-white border-[#e5e5eb] hover:border-[#cfcfd8] shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#111116] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {opp.company?.name?.[0] || "C"}
                      </div>
                      <div className="truncate">
                        <div className="font-extrabold text-xs text-[#111116] truncate flex items-center gap-1.5">
                          <span>{opp.company?.name}</span>
                          {currentFeedback && (
                            <span
                              className={`text-[9px] font-sans font-bold px-1.5 py-0.2 rounded border ${currentFeedback.activeColor}`}
                            >
                              {currentFeedback.label}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#6b6e7d] truncate">
                          {opp.primaryContact?.name} • {opp.primaryContact?.jobTitle}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-rose-600">
                        {opp.actionScore}
                      </span>
                      <div className="text-[9px] text-[#8e919f] font-sans uppercase">
                        Action
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#2b2b34] font-medium mt-2 line-clamp-2">
                    {opp.title}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#f1f1f5] text-[10px]">
                    <span className="font-bold text-[#111116]">
                      {opp.estimatedValueRange}
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded ${
                        isUrgent
                          ? "bg-rose-100 text-rose-800 font-bold"
                          : "bg-[#f1f1f5] text-[#6b6e7d]"
                      }`}
                    >
                      {isUrgent ? `${Math.round(opp.triggerFreshnessHours * 60)}m ago` : `${Math.round(opp.triggerFreshnessHours)}h ago`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Center Pane: Original Signal, Buyer Profile & Daniel's Feedback (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#e5e5eb] rounded-2xl p-6 space-y-6 shadow-xs">
          {activeOpp ? (
            <>
              {/* Header */}
              <div className="border-b border-[#f1f1f5] pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-sans uppercase text-rose-600 font-bold tracking-wider px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                    {activeOpp.signalClassification ? activeOpp.signalClassification.replace(/_/g, " ").toUpperCase() : "EXPLICIT EXTERNAL BUYER"}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    activeOpp.opportunityConfidence === "confirmed_external_demand"
                      ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                      : activeOpp.opportunityConfidence === "strong_external_opportunity"
                      ? "text-blue-800 bg-blue-50 border-blue-200"
                      : "text-amber-800 bg-amber-50 border-amber-200"
                  }`}>
                    {activeOpp.opportunityConfidence ? activeOpp.opportunityConfidence.replace(/_/g, " ").toUpperCase() : "CONFIRMED DEMAND"}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-[#111116] mt-2">
                  {activeOpp.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#6b6e7d] mt-1">
                  <span>Source: <strong>{activeOpp.sourceDescription}</strong></span>
                  {activeOpp.publishedAt && (
                    <span className="text-[11px] text-slate-500">
                      Published: <strong>{activeOpp.publishedAt}</strong>
                    </span>
                  )}
                  {activeOpp.discoveredAt && (
                    <span className="text-[11px] text-slate-400">
                      Discovered: {activeOpp.discoveredAt}
                    </span>
                  )}
                </div>
              </div>

              {/* WHAT EVIDENCE ACTUALLY PROVES */}
              {activeOpp.whatEvidenceActuallyProves && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    What Evidence Actually Proves
                  </div>
                  <p className="text-xs text-amber-950/90 leading-relaxed font-sans font-medium">
                    {activeOpp.whatEvidenceActuallyProves}
                  </p>
                  {activeOpp.employmentSpendGbp && (
                    <div className="text-[11px] text-amber-800/80 font-mono pt-1">
                      Internal Employment Spend: <span className="font-bold">{activeOpp.employmentSpendGbp}</span> (Not Studio Project Budget)
                    </div>
                  )}
                </div>
              )}

              {/* DANIEL'S QUALITY FEEDBACK / CALIBRATION (Section Requirement) */}
              <div className="p-4 bg-[#f8f8fa] border border-[#e2e2ea] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-bold text-[#111116] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                    Daniel's Lead Calibration Controls
                  </span>
                  {activeOpp.feedback && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#cfcfda] text-[#111116]">
                      Saved: <strong className="text-rose-600 uppercase">{activeOpp.feedback.replace("_", " ")}</strong>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6b6e7d]">
                  Click to calibrate the search engine and store your verdict on this opportunity:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  {FEEDBACK_OPTIONS.map((opt) => {
                    const isSelected = activeOpp.feedback === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          if (onFeedback) {
                            onFeedback(activeOpp.id, opt.id);
                          }
                        }}
                        className={`px-2 py-1.5 text-xs font-sans font-bold rounded-lg border transition-all text-center ${
                          isSelected
                            ? opt.activeColor
                            : opt.color
                        }`}
                      >
                        {isSelected ? `✓ ${opt.label}` : opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ORIGINAL SIGNAL */}
              <div className="space-y-2">
                <span className="text-[10px] font-sans font-extrabold text-[#111116] uppercase tracking-wider block">
                  Original Public Signal Evidence
                </span>
                <div className="p-4 bg-[#fbfbfa] border-l-4 border-rose-500 rounded-r-xl space-y-3">
                  <p className="text-sm font-serif italic text-[#111116] leading-relaxed">
                    “{originalPost?.excerpt || activeOpp.needDescription}”
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#6b6e7d] pt-2 border-t border-[#ededf3]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#111116]">
                        {activeOpp.primaryContact?.name}
                      </span>
                      <span>({activeOpp.primaryContact?.jobTitle})</span>
                    </div>
                    {originalPost?.sourceUrl && (
                      <a
                        href={originalPost.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 text-[11px] hover:underline"
                      >
                        <span>Open Original Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Company & Budget Qualification Context */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] space-y-0.5">
                  <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold">
                    Estimated Budget Range
                  </span>
                  <div className="text-sm font-bold text-[#111116]">
                    {activeOpp.estimatedValueRange}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    Confidence: {activeOpp.budgetConfidence.replace("_", " ")}
                  </div>
                </div>

                <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] space-y-0.5">
                  <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold">
                    Creative Maturity Gap
                  </span>
                  <div className="text-sm font-bold text-[#111116] capitalize">
                    {activeOpp.company?.creativeMaturityRating?.replace("_", " ") || "High Need"}
                  </div>
                  <div className="text-[10px] text-[#6b6e7d]">
                    High strategic motion demand
                  </div>
                </div>
              </div>

              {/* Matched Relevant Work Proof */}
              <div className="space-y-2">
                <span className="text-[10px] font-sans font-bold text-[#6b6e7d] uppercase tracking-wider block">
                  Relevant Matched Case Studies
                </span>
                <div className="space-y-1.5">
                  {activeOpp.matchedProof.map((proof, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white border border-[#e5e5eb] rounded-xl text-xs space-y-1"
                    >
                      <div className="font-bold text-[#111116]">{proof.workTitle}</div>
                      <div className="text-[11px] text-[#6b6e7d]">
                        {proof.relevanceRationale}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-[#6b6e7d]">
              Select an opportunity to view verified evidence.
            </div>
          )}
        </div>

        {/* Right Pane: Direct Action Workbench & Pre-Computed Outreach (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-[#e5e5eb] rounded-2xl p-5 space-y-4 shadow-xs">
            <span className="text-[10px] font-sans font-bold text-[#111116] uppercase tracking-wider block">
              Recommended Next Action
            </span>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Strategic Play
              </span>
              <p className="text-xs text-[#111116] leading-relaxed font-medium">
                {activeOpp?.recommendedAction || "Respond directly to public post citing relevant proof."}
              </p>
            </div>

            {/* Outreach Preview Tabs */}
            {activeOpp?.outreachDrafts && (
              <div className="pt-2 border-t border-[#f1f1f5] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-bold text-[#6b6e7d] uppercase tracking-wider">
                    Prepared Outreach Drafts
                  </span>
                  {copiedItem && (
                    <span className="text-[10px] text-emerald-600 font-bold">
                      Copied {copiedItem}!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-[#f4f4f7] p-1 rounded-lg text-[10px] font-bold">
                  {(
                    [
                      { id: "email", label: "Email" },
                      { id: "linkedin", label: "LinkedIn" },
                      { id: "call", label: "Call Angle" },
                      { id: "schedule", label: "Schedule" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveOutreachTab(t.id)}
                      className={`flex-1 py-1 rounded transition-all text-center ${
                        activeOutreachTab === t.id
                          ? "bg-white text-[#111116] shadow-xs"
                          : "text-[#6b6e7d] hover:text-[#111116]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="bg-[#fbfbfa] p-3 rounded-xl border border-[#e5e5eb] text-xs space-y-2">
                  {activeOutreachTab === "email" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#6b6e7d]">
                        <span>Subject:</span>
                        <button
                          onClick={() =>
                            handleCopy(
                              `Subject: ${activeOpp.outreachDrafts?.emailSubject}\n\n${activeOpp.outreachDrafts?.emailBody}`,
                              "Email"
                            )
                          }
                          className="hover:text-[#111116] text-rose-600 font-bold flex items-center gap-1 text-[10px]"
                        >
                          <Copy className="w-2.5 h-2.5" /> Copy Email
                        </button>
                      </div>
                      <div className="font-bold text-[#111116] text-[11px]">
                        {activeOpp.outreachDrafts.emailSubject}
                      </div>
                      <div className="text-[11px] text-[#454552] whitespace-pre-wrap font-sans max-h-40 overflow-y-auto pr-1">
                        {activeOpp.outreachDrafts.emailBody}
                      </div>
                    </div>
                  )}

                  {activeOutreachTab === "linkedin" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#6b6e7d]">
                        <span>Connection Message:</span>
                        <button
                          onClick={() =>
                            handleCopy(
                              activeOpp.outreachDrafts?.linkedinMessage || "",
                              "LinkedIn"
                            )
                          }
                          className="hover:text-[#111116] text-rose-600 font-bold flex items-center gap-1 text-[10px]"
                        >
                          <Copy className="w-2.5 h-2.5" /> Copy Message
                        </button>
                      </div>
                      <div className="text-[11px] text-[#454552] whitespace-pre-wrap font-sans">
                        {activeOpp.outreachDrafts.linkedinMessage}
                      </div>
                    </div>
                  )}

                  {activeOutreachTab === "call" && (
                    <div className="space-y-2 text-[11px]">
                      <div className="text-[#6b6e7d]">
                        <strong className="text-[#111116]">Opening Hook:</strong>{" "}
                        {activeOpp.outreachDrafts.callAngle.openingLine}
                      </div>
                      <div className="text-[#6b6e7d]">
                        <strong className="text-[#111116]">Likely Pushback:</strong>{" "}
                        {activeOpp.outreachDrafts.callAngle.likelyObjection}
                      </div>
                    </div>
                  )}

                  {activeOutreachTab === "schedule" && (
                    <div className="space-y-1 text-[11px] text-[#454552]">
                      <div className="font-bold text-[#111116] flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3 text-rose-600" /> Follow-Up Cadence
                      </div>
                      <p className="leading-relaxed">
                        {activeOpp.followUpSchedule ||
                          "Day 1: Direct outreach -> Day 3: Follow-up case study -> Day 7: Check-in note."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={() => activeOpp && onOpenOutreachModal(activeOpp, "email")}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open Full Outreach Composer</span>
              </button>

              <button
                onClick={() => activeOpp && onSelectOpportunity(activeOpp)}
                className="w-full py-2 bg-[#f4f4f7] hover:bg-[#e9e9ee] text-[#111116] font-bold text-xs rounded-xl transition-colors border border-[#e5e5eb] flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Deep Research Drawer</span>
              </button>

              <button
                onClick={() => {
                  if (activeOpp && onMoveStage) onMoveStage(activeOpp.id, "contacted");
                }}
                className="w-full py-2 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl transition-colors border border-emerald-200 flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Contacted</span>
              </button>

              <button
                onClick={() => {
                  if (activeOpp && onMoveStage) onMoveStage(activeOpp.id, "rejected");
                }}
                className="w-full py-2 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl transition-colors border border-rose-200 flex items-center justify-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Disqualify / Reject</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
