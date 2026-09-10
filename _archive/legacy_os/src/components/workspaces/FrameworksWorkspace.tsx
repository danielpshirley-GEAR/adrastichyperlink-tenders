"use client";

import React from "react";
import { FrameworkItem } from "@/lib/types";
import { Award, ExternalLink, Calendar, CheckCircle2, Clock, ArrowRight, Check } from "lucide-react";

interface FrameworksWorkspaceProps {
  frameworks: FrameworkItem[];
}

export function FrameworksWorkspace({ frameworks }: FrameworksWorkspaceProps) {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-teal-600 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Award className="w-3.5 h-3.5" />
            ENGINE 8 • FRAMEWORKS & APPROVED SUPPLIER LISTS (SECTION 17)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Frameworks & Panels
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Supplier frameworks, approved vendor rosters, and Dynamic Purchasing Systems (DPS).
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Pre-qualifies Adrastichyperlink so public buyers and universities can award contracts directly without running tenders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold shadow-xs">
            High Lifetime Value Access Routes
          </span>
        </div>
      </div>

      {/* Framework Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {frameworks.map((fw) => (
          <div
            key={fw.id}
            className="bg-white border border-[#e5e5eb] rounded-2xl p-7 shadow-xs hover:border-[#cfcfd8] transition-all space-y-5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-sans font-bold text-teal-700 uppercase tracking-wider">
                    {fw.issuerName}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#111116] tracking-tight">
                    {fw.title}
                  </h3>
                </div>

                <span className="text-[10px] font-sans px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold uppercase shrink-0">
                  {fw.status.replace("_", " ")}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 bg-[#f8f8fa] p-4 rounded-xl border border-[#e5e5eb] text-xs">
                <div>
                  <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                    Typical Contract Values
                  </span>
                  <span className="font-mono font-bold text-[#111116]">
                    {fw.typicalContractValues}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                    Evidence Readiness
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {fw.readinessScorePercent}% Complete
                  </span>
                </div>
              </div>

              {/* Requirements & Windows */}
              <div className="space-y-2 text-xs text-[#2b2b34]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#8e919f]">Application Window:</span>
                  <span className="font-semibold text-[#111116]">Opens {fw.openingDate}</span>
                </div>
                <div className="p-3 bg-[#fbfbfa] rounded-xl border border-[#e5e5eb] text-xs space-y-1">
                  <span className="font-bold text-[#111116] block">Required Evidence:</span>
                  <p className="text-[#6b6e7d] leading-relaxed">
                    {fw.requiredEvidence.join(", ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#f1f1f5] flex items-center justify-between">
              <a
                href={fw.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <span>Framework Guidelines</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button className="px-4 py-2 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Prepare Roster Packet</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
