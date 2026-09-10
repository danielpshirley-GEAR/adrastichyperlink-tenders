"use client";

import React, { useState } from "react";
import { Opportunity } from "@/lib/types";
import { FileText, CheckCircle2, DollarSign, Clock, Copy, Check } from "lucide-react";

interface ProposalsWorkspaceProps {
  opportunities: Opportunity[];
}

export function ProposalsWorkspace({ opportunities }: ProposalsWorkspaceProps) {
  const proposalOpps = opportunities.filter((o) => o.proposalBrief);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity>(proposalOpps[0] || opportunities[0]);
  const [copied, setCopied] = useState(false);

  const proposal = selectedOpp?.proposalBrief;

  const handleCopy = () => {
    if (!proposal) return;
    const text = `ADRASTICHYPERLINK STUDIO PROPOSAL: ${selectedOpp.company?.name}\n\n1. WHAT WE LEARNED\n${proposal.whatWeLearned}\n\n2. THE PROBLEM\n${proposal.theProblem}\n\n3. DESIRED OUTCOME\n${proposal.desiredOutcome}\n\n4. CREATIVE APPROACH\n${proposal.recommendedCreativeApproach}\n\n5. DELIVERABLES (${proposal.singleRecommendedSolution.title})\n${proposal.singleRecommendedSolution.deliverables.map((d) => `• ${d}`).join("\n")}\n\n6. TIMELINE: ${proposal.singleRecommendedSolution.timelineWeeks} Weeks\n\n7. INVESTMENT: £${proposal.singleRecommendedSolution.investmentGbp.toLocaleString("en-GB")}\n\n8. COMMERCIAL TERMS: ${proposal.singleRecommendedSolution.paymentStructure}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e5eb] pb-6">
        <div>
          <div className="text-[11px] font-sans text-slate-700 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <FileText className="w-3.5 h-3.5" />
            SALES • SINGLE RECOMMENDED SOLUTION ENGINE
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Proposals & Commercial Terms
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            No tiered bronze/silver/gold option confusion. One single confident solution with non-negotiable 50% deposit terms.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Crafted for rapid executive decision making and high closing velocity.
          </p>
        </div>

        {proposal && (
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-[#111116] text-white font-bold text-xs rounded-xl hover:bg-[#23232c] transition-all flex items-center gap-1.5 shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied Proposal" : "Copy Formatted Proposal"}</span>
          </button>
        )}
      </div>

      {/* Proposal Content */}
      {proposal ? (
        <div className="bg-white border border-[#e5e5eb] rounded-2xl p-8 space-y-6 shadow-xs">
          <div className="flex items-start justify-between border-b border-[#f1f1f5] pb-5">
            <div>
              <span className="text-[10px] font-sans text-[#8e919f] uppercase font-bold">
                Active Client Scope
              </span>
              <h2 className="text-2xl font-extrabold text-[#111116] mt-1">
                {selectedOpp.company?.name} — {proposal.singleRecommendedSolution.title}
              </h2>
            </div>

            <div className="text-right">
              <div className="text-3xl font-mono font-extrabold text-emerald-700">
                £{proposal.singleRecommendedSolution.investmentGbp.toLocaleString("en-GB")}
              </div>
              <div className="text-[10px] text-[#6b6e7d] font-sans font-bold uppercase">
                {proposal.singleRecommendedSolution.paymentStructure}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
            <div className="space-y-4">
              <div className="p-4 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] space-y-1">
                <span className="font-bold text-[#111116] block uppercase tracking-wider text-[10px]">
                  1. What We Learned
                </span>
                <p className="text-[#4a4d5a]">{proposal.whatWeLearned}</p>
              </div>

              <div className="p-4 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] space-y-1">
                <span className="font-bold text-[#111116] block uppercase tracking-wider text-[10px]">
                  2. The Core Problem
                </span>
                <p className="text-[#4a4d5a]">{proposal.theProblem}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] space-y-1">
                <span className="font-bold text-[#111116] block uppercase tracking-wider text-[10px]">
                  3. Strategic Creative Solution
                </span>
                <p className="text-[#4a4d5a]">{proposal.recommendedCreativeApproach}</p>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                <span className="font-bold text-emerald-900 block uppercase tracking-wider text-[10px]">
                  4. Scope Deliverables ({proposal.singleRecommendedSolution.timelineWeeks} Weeks)
                </span>
                <ul className="space-y-1 text-[#111116]">
                  {proposal.singleRecommendedSolution.deliverables.map((del, i) => (
                    <li key={i} className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{del}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-[#e5e5eb] rounded-2xl text-xs text-[#6b6e7d]">
          Select an opportunity with a drafted proposal brief.
        </div>
      )}
    </div>
  );
}
