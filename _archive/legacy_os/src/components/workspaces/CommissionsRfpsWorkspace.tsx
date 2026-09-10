"use client";

import React, { useState } from "react";
import { Opportunity } from "@/lib/types";
import { FileCode, Sparkles, CheckCircle2, Clock, Send, Eye, Check, Ban, HelpCircle } from "lucide-react";

interface CommissionsRfpsWorkspaceProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onOpenOutreachModal: (opp: Opportunity, tab?: "email" | "linkedin" | "call") => void;
}

export function CommissionsRfpsWorkspace({
  opportunities,
  onSelectOpportunity,
  onOpenOutreachModal,
}: CommissionsRfpsWorkspaceProps) {
  const rfpOpps = opportunities.filter(
    (o) => o.acquisitionEngine === "private_rfp" && o.pipelineStage !== "rejected"
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-indigo-600 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <FileCode className="w-3.5 h-3.5" />
            ENGINE 6 • COMMISSIONS & PRIVATE RFPS (SECTION 14)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Commissions & Private RFPs
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Private briefs, creative commissions, brand tenders, and agency reviews without public bureaucracy.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Evaluates preparation effort vs probability of winning to protect your time and capital.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-xs">
            Decision Engine Active
          </span>
        </div>
      </div>

      {/* Briefs List */}
      <div className="space-y-6">
        {rfpOpps.map((opp) => (
          <div
            key={opp.id}
            className="bg-white border border-[#e5e5eb] rounded-2xl p-7 shadow-xs hover:border-[#cfcfd8] transition-all space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-[#f1f1f5] pb-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                    PRIVATE COMMERCIAL BRIEF
                  </span>
                  <span className="text-[#6b6e7d]">•</span>
                  <span className="text-xs font-bold text-[#111116]">
                    Budget: {opp.estimatedValueRange}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#111116] tracking-tight">
                  {opp.company?.name} — {opp.title}
                </h2>
                <p className="text-xs text-[#6b6e7d]">
                  Brief Owner: <strong className="text-[#111116]">{opp.primaryContact?.name}</strong> ({opp.primaryContact?.jobTitle})
                </p>
              </div>

              <div className="text-right p-3 bg-[#f8f8fa] rounded-2xl border border-[#e5e5eb]">
                <div className="text-2xl font-mono font-extrabold text-indigo-700">
                  {opp.actionScore}
                </div>
                <div className="text-[9px] font-sans uppercase font-bold text-[#8e919f]">
                  Action Score
                </div>
              </div>
            </div>

            {/* Scope, Effort, Probability Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8f8fa] p-4 rounded-2xl border border-[#e5e5eb] text-xs">
              <div>
                <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                  Submission Deadline
                </span>
                <span className="text-sm font-bold text-[#111116]">
                  12 Days Remaining
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                  Preparation Effort
                </span>
                <span className="text-sm font-bold text-amber-700">
                  Low / Standard Brief
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                  Win Probability
                </span>
                <span className="text-sm font-bold text-emerald-700">
                  {opp.winProbabilityPercent || 65}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                  Competition Level
                </span>
                <span className="text-sm font-bold text-[#111116]">
                  Closed Invite (3 agencies)
                </span>
              </div>
            </div>

            {/* Decision Engine Buttons (Section 14: APPLY, INVESTIGATE, PASS) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#6b6e7d]">AI Recommendation:</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  APPLY — High win rate, verified budget
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectOpportunity(opp)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-[#4a4d5a] font-bold text-xs rounded-xl transition-colors border border-[#e5e5eb] flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5 text-rose-600" />
                  <span>Pass</span>
                </button>
                <button
                  onClick={() => onSelectOpportunity(opp)}
                  className="px-4 py-2 bg-[#f4f4f7] hover:bg-[#e9e9ee] text-[#111116] font-bold text-xs rounded-xl transition-colors border border-[#e5e5eb] flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Investigate Scope</span>
                </button>
                <button
                  onClick={() => onOpenOutreachModal(opp, "email")}
                  className="px-5 py-2 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Apply / Pitch Brief</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
