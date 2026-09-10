"use client";

import React from "react";
import { Opportunity } from "@/lib/types";
import { Building2, Sparkles, Mail, CheckCircle2, Users, HelpCircle, ArrowRight, Eye } from "lucide-react";

interface InternalNeedsWorkspaceProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onOpenOutreachModal: (opp: Opportunity, tab?: "email" | "linkedin" | "call") => void;
}

export function InternalNeedsWorkspace({
  opportunities,
  onSelectOpportunity,
  onOpenOutreachModal,
}: InternalNeedsWorkspaceProps) {
  const internalOpps = opportunities.filter(
    (o) => o.acquisitionEngine === "internal_needs" && o.pipelineStage !== "rejected"
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-emerald-600 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Building2 className="w-3.5 h-3.5" />
            ENGINE 3 • INTERNAL BUSINESS NEEDS (SECTION 11)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Internal Organisational Needs
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Corporate transformation, change programmes, employee experience, and training briefs.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Targets non-marketing executive budgets: Heads of Internal Comms, Transformation Directors, People Officers, and Chiefs of Staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold shadow-xs">
            Non-Marketing Budgets Active
          </span>
        </div>
      </div>

      {/* Internal Needs Opportunity Cards */}
      <div className="space-y-6">
        {internalOpps.map((opp) => (
          <div
            key={opp.id}
            className="bg-white border border-[#e5e5eb] rounded-2xl p-7 shadow-xs hover:border-[#cfcfd8] transition-all space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-[#f1f1f5] pb-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    EXECUTIVE TRANSFORMATION BRIEF
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
                  Problem Owner: <strong className="text-[#111116]">{opp.primaryContact?.name}</strong> ({opp.primaryContact?.jobTitle})
                </p>
              </div>

              <div className="text-right p-3 bg-[#f8f8fa] rounded-2xl border border-[#e5e5eb]">
                <div className="text-2xl font-mono font-extrabold text-emerald-700">
                  {opp.actionScore}
                </div>
                <div className="text-[9px] font-sans uppercase font-bold text-[#8e919f]">
                  Action Score
                </div>
              </div>
            </div>

            {/* 5-Question Strategic Diagnosis (Section 11) */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-bold text-[#8e919f] uppercase tracking-wider block">
                5-Question Strategic Commercial Diagnosis
              </span>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-[#f8f8fa] p-4 rounded-2xl border border-[#e5e5eb] text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-sans uppercase text-emerald-700 font-bold block">
                    1. What is happening?
                  </span>
                  <p className="text-[#111116] text-xs leading-relaxed font-medium">
                    Firm-wide restructuring and operating model digitization across UK offices.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-sans uppercase text-emerald-700 font-bold block">
                    2. Who must understand it?
                  </span>
                  <p className="text-[#111116] text-xs leading-relaxed font-medium">
                    320+ wealth managers, client advisors, and internal governance teams.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-sans uppercase text-emerald-700 font-bold block">
                    3. What problem exists?
                  </span>
                  <p className="text-[#111116] text-xs leading-relaxed font-medium">
                    11 marketers, 1 designer, 0 motion talent. Severe internal friction explaining technical shifts.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-sans uppercase text-emerald-700 font-bold block">
                    4. Who owns the problem?
                  </span>
                  <p className="text-[#111116] text-xs leading-relaxed font-medium">
                    Alistair Campbell, Head of Corporate Transformation & Change.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-sans uppercase text-emerald-700 font-bold block">
                    5. How Adrastichyperlink helps?
                  </span>
                  <p className="text-emerald-900 text-xs leading-relaxed font-bold">
                    Motion explainer series + executive presentation system (£15k–£25k).
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => onSelectOpportunity(opp)}
                className="px-4 py-2 bg-[#f4f4f7] hover:bg-[#e9e9ee] text-[#111116] font-bold text-xs rounded-xl transition-colors border border-[#e5e5eb] flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Examine Relevant MoD Case Study</span>
              </button>

              <button
                onClick={() => onOpenOutreachModal(opp, "email")}
                className="px-5 py-2 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Transformation Briefing Note</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
