"use client";

import React, { useState } from "react";
import { Opportunity } from "@/lib/types";
import { Layers, Mail, Handshake, ExternalLink, Sparkles, Eye, PhoneCall, Building2 } from "lucide-react";

interface AgencyOverflowWorkspaceProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onOpenOutreachModal: (opp: Opportunity, tab?: "email" | "linkedin" | "call") => void;
}

export function AgencyOverflowWorkspace({
  opportunities,
  onSelectOpportunity,
  onOpenOutreachModal,
}: AgencyOverflowWorkspaceProps) {
  const [selectedView, setSelectedView] = useState<
    | "need_support"
    | "account_wins"
    | "no_motion"
    | "freelancers"
    | "growing"
    | "relationship"
    | "existing"
  >("need_support");

  const agencyOpps = opportunities.filter(
    (o) => o.acquisitionEngine === "agency_overflow" && o.pipelineStage !== "rejected"
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-violet-600 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Layers className="w-3.5 h-3.5" />
            ENGINE 5 • AGENCY OPPORTUNITIES (SECTION 13)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Agency & Studio Opportunities
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Agencies and design studios that need overflow or specialist production support.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Goal: Become a trusted external motion and design resource across brand, advertising, PR, and digital shops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-xs font-bold shadow-xs">
            Partnership Pipeline Active
          </span>
        </div>
      </div>

      {/* Views Tabs (Section 13) */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#e5e5eb] pb-3">
        {(
          [
            { id: "need_support", label: "NEED SUPPORT NOW" },
            { id: "account_wins", label: "NEW ACCOUNT WINS" },
            { id: "no_motion", label: "NO MOTION CAPABILITY" },
            { id: "freelancers", label: "FREELANCERS WANTED" },
            { id: "growing", label: "GROWING" },
            { id: "relationship", label: "RELATIONSHIP BUILDING" },
            { id: "existing", label: "EXISTING PARTNERS" },
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

      {/* Agency Opportunity Cards */}
      <div className="space-y-6">
        {agencyOpps.map((opp) => (
          <div
            key={opp.id}
            className="bg-white border border-[#e5e5eb] rounded-2xl p-7 shadow-xs hover:border-[#cfcfd8] transition-all space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-[#f1f1f5] pb-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200">
                    AGENCY ACCOUNT EXPANSION
                  </span>
                  <span className="text-[#6b6e7d]">•</span>
                  <span className="text-xs font-bold text-emerald-700">
                    Opportunity: {opp.estimatedValueRange}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#111116] tracking-tight">
                  {opp.company?.name} — {opp.title}
                </h2>
                <p className="text-xs text-[#6b6e7d]">
                  Agency Partner / ECD: <strong className="text-[#111116]">{opp.primaryContact?.name}</strong> ({opp.primaryContact?.jobTitle})
                </p>
              </div>

              <div className="text-right p-3 bg-[#f8f8fa] rounded-2xl border border-[#e5e5eb]">
                <div className="text-2xl font-mono font-extrabold text-violet-700">
                  {opp.actionScore}
                </div>
                <div className="text-[9px] font-sans uppercase font-bold text-[#8e919f]">
                  Action Score
                </div>
              </div>
            </div>

            {/* Relationship History & Trigger Context */}
            <div className="p-4 bg-[#f8f8fa] border border-[#e5e5eb] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1 max-w-2xl">
                <span className="text-[10px] font-sans font-bold uppercase text-[#8e919f] block">
                  Commercial Partnership Objective
                </span>
                <p className="text-[#111116] font-medium leading-relaxed">
                  Position Adrastichyperlink as Verve & Co's plug-and-play senior motion direction arm for newly won multi-market global beverage account. Avoids permanent overhead while unlocking pitch-level motion quality.
                </p>
              </div>

              <div className="shrink-0 p-3 bg-white rounded-xl border border-[#e5e5eb] text-right">
                <span className="text-[9px] font-sans uppercase text-[#8e919f] block">Target Relationship</span>
                <span className="text-xs font-bold text-violet-800">£3.5k–£5k/mo Retainer</span>
              </div>
            </div>

            {/* Matched Evidence Proof */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-bold text-[#8e919f] uppercase tracking-wider block">
                Relevant Creative Proof to Cite
              </span>
              <div className="p-3 bg-white border border-[#e5e5eb] rounded-xl text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#111116]">
                    The London Essence Co. — Luxury Beverage Motion & Design Direction
                  </div>
                  <div className="text-[11px] text-[#6b6e7d]">
                    Proves direct luxury beverage category mastery and photorealistic commercial rendering.
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                  Direct Category Match
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
                <span>Examine Agency Intelligence</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenOutreachModal(opp, "call")}
                  className="px-4 py-2 bg-white hover:bg-violet-50 text-violet-700 font-bold text-xs rounded-xl transition-colors border border-violet-200"
                >
                  Direct Call Script
                </button>
                <button
                  onClick={() => onOpenOutreachModal(opp, "email")}
                  className="px-5 py-2 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Motion Capacity Note</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
