"use client";

import React, { useState } from "react";
import { Opportunity } from "@/lib/types";
import {
  TrendingUp,
  Layers,
  Mail,
  DollarSign,
  Calendar,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  CheckCircle2,
} from "lucide-react";

interface BusinessSignalsWorkspaceProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onOpenOutreachModal: (opp: Opportunity, tab?: "email" | "linkedin" | "call") => void;
}

export function BusinessSignalsWorkspace({
  opportunities,
  onSelectOpportunity,
  onOpenOutreachModal,
}: BusinessSignalsWorkspaceProps) {
  const [selectedView, setSelectedView] = useState<
    | "strongest"
    | "funding"
    | "expansion"
    | "leadership"
    | "m_a"
    | "launch"
    | "hiring"
    | "watchlist"
  >("strongest");

  const signalOpps = opportunities.filter(
    (o) => o.acquisitionEngine === "triggered_businesses" && o.pipelineStage !== "rejected"
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-sky-600 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            ENGINE 2 • BUSINESS SIGNALS & COMPOUND TRIGGERS (SECTION 10)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Business Signals
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Find businesses likely to spend because something important has changed.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Investigative intelligence layer monitoring funding rounds, executive appointments, M&A, and market expansions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
            <Layers className="w-3.5 h-3.5" />
            <span>Signal Stacking Active</span>
          </span>
        </div>
      </div>

      {/* Views Tabs (Section 10) */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#e5e5eb] pb-3">
        {(
          [
            { id: "strongest", label: "STRONGEST COMBINATIONS" },
            { id: "funding", label: "FUNDING" },
            { id: "expansion", label: "EXPANSION" },
            { id: "leadership", label: "LEADERSHIP" },
            { id: "m_a", label: "M&A" },
            { id: "launch", label: "LAUNCH" },
            { id: "hiring", label: "HIRING" },
            { id: "watchlist", label: "WATCHLIST" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedView(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
              selectedView === t.id
                ? "bg-[#111116] text-white shadow-xs"
                : "text-[#6b6e7d] hover:text-[#111116] bg-[#f4f4f7]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stacked Signal Timeline Cards */}
      <div className="space-y-6">
        {signalOpps.map((opp) => {
          const company = opp.company;
          const stacks = company?.signalStack || [
            { id: "s1", date: "Apr 2026", headline: "£9M Series A investment", type: "funding" as const, confidence: "verified" as const },
            { id: "s2", date: "Jun 2026", headline: "New CMO Dirk Schneider appointed", type: "leadership" as const, confidence: "verified" as const },
            { id: "s3", date: "Aug 2026", headline: "European expansion announced into Nordics", type: "expansion" as const, confidence: "verified" as const },
            { id: "s4", date: "Sep 2026", headline: "Brand & website still reflect legacy proposition", type: "expansion" as const, confidence: "verified" as const },
          ];

          return (
            <div
              key={opp.id}
              className="bg-white border border-[#e5e5eb] rounded-2xl p-7 shadow-xs hover:border-[#cfcfd8] transition-all space-y-6"
            >
              {/* Card Header */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-[#f1f1f5] pb-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {stacks.length} COMPOUND SIGNALS STACKED
                    </span>
                    <span className="text-[#6b6e7d]">•</span>
                    <span className="text-xs font-bold text-emerald-700">
                      Estimated: {opp.estimatedValueRange}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#111116] tracking-tight">
                    {company?.name} — {opp.title}
                  </h2>
                  <p className="text-xs text-[#6b6e7d]">
                    Target Buyer: <strong className="text-[#111116]">{opp.primaryContact?.name}</strong> ({opp.primaryContact?.jobTitle})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right p-3 bg-[#f8f8fa] rounded-2xl border border-[#e5e5eb]">
                    <div className="text-2xl font-mono font-extrabold text-sky-700">
                      {opp.actionScore}
                    </div>
                    <div className="text-[9px] font-sans uppercase font-bold text-[#8e919f]">
                      Action Score
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Signal Timeline (Section 10) */}
              <div className="space-y-2">
                <span className="text-[10px] font-sans font-bold text-[#8e919f] uppercase tracking-wider block">
                  Corporate Signal Progression Timeline
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {stacks.map((sig, idx) => (
                    <div
                      key={sig.id || idx}
                      className="p-3.5 bg-[#f8f8fa] border border-[#e5e5eb] rounded-xl space-y-1 relative"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-sky-700">
                        <span>{sig.date || `Event ${idx + 1}`}</span>
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                      </div>
                      <div className="text-xs font-semibold text-[#111116] leading-snug">
                        {sig.headline}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Commercial View & Story */}
              <div className="p-5 bg-gradient-to-r from-sky-50/50 via-white to-sky-50/30 border border-sky-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>AI Strategic Assessment</span>
                </div>
                <p className="text-xs text-[#2b2b34] leading-relaxed font-medium">
                  {opp.needDescription ||
                    "The company's operational maturity appears to have outgrown its public-facing presentation. Raised £9M to commercialize expansion, but brand assets lag significantly behind commercial scale."}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-sky-100 text-xs">
                  <span className="font-semibold text-[#111116]">
                    Recommended Package: Brand Consolidation + Explanatory Motion System
                  </span>
                  <span className="font-mono font-bold text-emerald-800">
                    £15k–£30k
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => onSelectOpportunity(opp)}
                  className="px-4 py-2 bg-[#f4f4f7] hover:bg-[#e9e9ee] text-[#111116] font-bold text-xs rounded-xl transition-colors border border-[#e5e5eb] flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Account Intelligence</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenOutreachModal(opp, "linkedin")}
                    className="px-4 py-2 bg-white hover:bg-sky-50 text-sky-700 font-bold text-xs rounded-xl transition-colors border border-sky-200"
                  >
                    LinkedIn InMail Angle
                  </button>
                  <button
                    onClick={() => onOpenOutreachModal(opp, "email")}
                    className="px-5 py-2 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Consolidation Proposal</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
