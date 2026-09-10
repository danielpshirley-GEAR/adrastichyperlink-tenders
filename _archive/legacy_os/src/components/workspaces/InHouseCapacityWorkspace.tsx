"use client";

import React from "react";
import { Opportunity } from "@/lib/types";
import { Cpu, Users, Clock, Mail, AlertTriangle, ArrowRight, Eye, Sparkles } from "lucide-react";

interface InHouseCapacityWorkspaceProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onOpenOutreachModal: (opp: Opportunity, tab?: "email" | "linkedin" | "call") => void;
}

export function InHouseCapacityWorkspace({
  opportunities,
  onSelectOpportunity,
  onOpenOutreachModal,
}: InHouseCapacityWorkspaceProps) {
  const capacityOpps = opportunities.filter(
    (o) => o.acquisitionEngine === "capacity_overflow" && o.pipelineStage !== "rejected"
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-amber-600 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Cpu className="w-3.5 h-3.5" />
            ENGINE 4 • IN-HOUSE CREATIVE CAPACITY (SECTION 12)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            In-House Capacity Deficits
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Find companies that already value creative work but lack enough capability internally.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Identifies marketing-to-design headcount imbalances, unfulfilled creative vacancies (60+ days open), and production bottlenecks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold shadow-xs">
            Proposition: Embedded Studio Firepower
          </span>
        </div>
      </div>

      {/* Capacity Opportunity Cards */}
      <div className="space-y-6">
        {capacityOpps.map((opp) => {
          const mktSize = opp.company?.marketingTeamSize || 14;
          const designSize = opp.company?.creativeTeamSize || 2;
          const motionSize = 0;

          return (
            <div
              key={opp.id}
              className="bg-white border border-[#e5e5eb] rounded-2xl p-7 shadow-xs hover:border-[#cfcfd8] transition-all space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-[#f1f1f5] pb-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                      CAPACITY DEFICIT DETECTED
                    </span>
                    <span className="text-[#6b6e7d]">•</span>
                    <span className="text-xs font-bold text-[#111116]">
                      Retainer Value: {opp.estimatedValueRange}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#111116] tracking-tight">
                    {opp.company?.name} — {opp.title}
                  </h2>
                  <p className="text-xs text-[#6b6e7d]">
                    Hiring Manager / Buyer: <strong className="text-[#111116]">{opp.primaryContact?.name}</strong> ({opp.primaryContact?.jobTitle})
                  </p>
                </div>

                <div className="text-right p-3 bg-[#f8f8fa] rounded-2xl border border-[#e5e5eb]">
                  <div className="text-2xl font-mono font-extrabold text-amber-600">
                    {opp.actionScore}
                  </div>
                  <div className="text-[9px] font-sans uppercase font-bold text-[#8e919f]">
                    Action Score
                  </div>
                </div>
              </div>

              {/* Department Capacity Map (Section 12) */}
              <div className="space-y-3 bg-[#f8f8fa] p-5 rounded-2xl border border-[#e5e5eb]">
                <div className="flex items-center justify-between text-xs font-bold text-[#111116]">
                  <span>TEAM RATIO ANALYSIS</span>
                  <span className="text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded text-[11px] font-mono">
                    CAPACITY GAP: CRITICAL
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Marketing */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[#6b6e7d]">
                      <span>Marketing Team</span>
                      <span className="font-bold text-[#111116]">{mktSize} staff</span>
                    </div>
                    <div className="w-full bg-[#e5e5eb] h-2.5 rounded-full overflow-hidden">
                      <div className="bg-[#111116] h-full rounded-full" style={{ width: "90%" }} />
                    </div>
                  </div>

                  {/* Design */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[#6b6e7d]">
                      <span>Brand / Graphic Design</span>
                      <span className="font-bold text-[#111116]">{designSize} staff</span>
                    </div>
                    <div className="w-full bg-[#e5e5eb] h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: "25%" }} />
                    </div>
                  </div>

                  {/* Motion */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[#6b6e7d]">
                      <span>In-House 3D / Motion Direction</span>
                      <span className="font-bold text-rose-600">0 staff (72-day open vacancy)</span>
                    </div>
                    <div className="w-full bg-[#e5e5eb] h-2.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: "0%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tailored Value Proposition */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-sans font-bold text-amber-900 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Recommended Proposition
                </span>
                <p className="text-xs text-[#111116] leading-relaxed font-medium">
                  <strong>Embedded senior motion/design support without permanent headcount.</strong> Solve their 72-day motion vacancy immediately by delivering the Q3 launch explainer on project/retainer terms.
                </p>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => onSelectOpportunity(opp)}
                  className="px-4 py-2 bg-[#f4f4f7] hover:bg-[#e9e9ee] text-[#111116] font-bold text-xs rounded-xl transition-colors border border-[#e5e5eb] flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Job Post Evidence</span>
                </button>

                <button
                  onClick={() => onOpenOutreachModal(opp, "email")}
                  className="px-5 py-2 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Pitch Embedded Motion Support</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
