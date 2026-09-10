"use client";

import React, { useState } from "react";
import { Opportunity } from "@/lib/types";
import { X, FileText, CheckCircle2, Shield, DollarSign, Copy, Check } from "lucide-react";

interface ProposalModalProps {
  opportunity: Opportunity;
  onClose: () => void;
}

export function ProposalModal({ opportunity, onClose }: ProposalModalProps) {
  const proposal = opportunity.proposalBrief;
  const [selectedVariant, setSelectedVariant] = useState<"recommended" | "reduced" | "expanded">("recommended");
  const [copied, setCopied] = useState(false);

  // Defaults if no custom proposal object
  const whatWeLearned = proposal?.whatWeLearned || `Through discovery with ${opportunity.company?.name}, we identified that their visual communication and motion assets require senior-led alignment to match organizational growth.`;
  const problem = proposal?.theProblem || opportunity.needDescription;
  const outcome = proposal?.desiredOutcome || "A world-class motion system and brand assets that establish clear market authority and drive measurable commercial traction.";
  const approach = proposal?.recommendedCreativeApproach || "A senior-led strategic sprint combining narrative scripting, 3D CAD / motion graphics execution, and multi-channel asset delivery.";
  
  const recommendedSol = proposal?.singleRecommendedSolution || {
    title: `${opportunity.company?.name} — Strategic Motion & Asset Package`,
    deliverables: [
      "Strategic creative direction & narrative script",
      "Full 3D / 2D motion graphics master asset (60–90s)",
      "3x modular social / stakeholder cutdowns",
      "Digital visual assets for web & presentation integration",
    ],
    timelineWeeks: 5,
    investmentGbp: opportunity.estimatedValueGbp || 12000,
    paymentStructure: "50% deposit upon commissioning, 50% upon final master asset sign-off",
  };

  const handleCopy = () => {
    const text = `ADRASTICHYPERLINK STUDIO PROPOSAL: ${opportunity.company?.name}\n\n1. WHAT WE LEARNED\n${whatWeLearned}\n\n2. THE PROBLEM\n${problem}\n\n3. DESIRED OUTCOME\n${outcome}\n\n4. RECOMMENDED CREATIVE APPROACH\n${approach}\n\n5. SCOPE & DELIVERABLES (${recommendedSol.title})\n${recommendedSol.deliverables.map((d) => `• ${d}`).join("\n")}\n\n6. TIMELINE: ${recommendedSol.timelineWeeks} Weeks\n\n7. INVESTMENT: £${recommendedSol.investmentGbp.toLocaleString("en-GB")}\n\n8. COMMERCIAL TERMS: ${recommendedSol.paymentStructure}\n\n9. NEXT STEP: Countersign agreement and confirm deposit to lock production start date.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#e2e2ea] w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-[#111116]">
        {/* Header */}
        <div className="p-5 border-b border-[#e2e2ea] flex items-center justify-between bg-white">
          <div>
            <div className="text-[10px] font-sans text-[#636375] uppercase flex items-center gap-1.5 font-bold tracking-wider">
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              SINGLE RECOMMENDED SOLUTION PROPOSAL (SECTION 26)
            </div>
            <h2 className="text-xl font-bold text-[#111116] tracking-tight mt-0.5 studio-display">
              {opportunity.company?.name} — Studio Engagement Proposal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#636375] hover:text-[#111116] rounded-lg hover:bg-[#f4f4f7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Diagnostic Context */}
          <div className="space-y-3">
            <div className="bg-[#fafafb] p-4 rounded-xl border border-[#e2e2ea] space-y-1">
              <span className="font-sans text-[#636375] uppercase text-[10px] font-bold tracking-wider">
                1. What We Learned
              </span>
              <p className="text-[#111116] leading-relaxed font-sans">{whatWeLearned}</p>
            </div>

            <div className="bg-[#fafafb] p-4 rounded-xl border border-[#e2e2ea] space-y-1">
              <span className="font-sans text-[#636375] uppercase text-[10px] font-bold tracking-wider">
                2. The Business Problem
              </span>
              <p className="text-[#111116] leading-relaxed font-sans">{problem}</p>
            </div>

            <div className="bg-[#fafafb] p-4 rounded-xl border border-[#e2e2ea] space-y-1">
              <span className="font-sans text-[#636375] uppercase text-[10px] font-bold tracking-wider">
                3. Desired Outcome
              </span>
              <p className="text-[#111116] leading-relaxed font-sans">{outcome}</p>
            </div>
          </div>

          {/* Solution & Deliverables Card */}
          <div className="bg-[#fafafb] p-5 rounded-xl border border-[#e2e2ea] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-sans uppercase text-purple-700 font-bold tracking-wider">
                  Recommended Solution (Primary)
                </span>
                <h3 className="text-base font-bold text-[#111116] mt-0.5 studio-display">
                  {recommendedSol.title}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-emerald-700">
                  £{recommendedSol.investmentGbp.toLocaleString("en-GB")}
                </div>
                <div className="text-[10px] font-sans text-[#636375] font-semibold">
                  Fixed Studio Investment
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-sans text-[#636375] uppercase text-[10px] font-bold block tracking-wider">
                Deliverables & Scope
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recommendedSol.deliverables.map((d, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white rounded-lg border border-[#e2e2ea] text-[#111116] flex items-start gap-2 text-[11px] font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#e2e2ea] text-xs">
              <div>
                <span className="font-sans text-[#636375] uppercase text-[10px] font-bold tracking-wider">
                  Estimated Timeline
                </span>
                <div className="text-[#111116] font-semibold font-mono mt-0.5">
                  {recommendedSol.timelineWeeks} Weeks from briefing
                </div>
              </div>
              <div>
                <span className="font-sans text-[#636375] uppercase text-[10px] font-bold tracking-wider">
                  Commercial Terms
                </span>
                <div className="text-[#111116] font-medium mt-0.5">
                  {recommendedSol.paymentStructure}
                </div>
              </div>
            </div>
          </div>

          {/* Scope Variant Options if present */}
          {(proposal?.optionalReducedScope || proposal?.optionalExpandedScope) && (
            <div className="space-y-2 pt-1">
              <span className="font-sans text-[#636375] uppercase text-[10px] font-bold tracking-wider">
                Strategic Scope Variants (Reduced / Expanded)
              </span>
              <div className="grid grid-cols-2 gap-3">
                {proposal.optionalReducedScope && (
                  <div className="p-4 bg-[#fafafb] rounded-xl border border-[#e2e2ea] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111116]">{proposal.optionalReducedScope.title}</span>
                      <span className="font-mono text-emerald-700 font-bold">£{proposal.optionalReducedScope.investmentGbp.toLocaleString("en-GB")}</span>
                    </div>
                    <p className="text-[#636375] text-[11px]">{proposal.optionalReducedScope.deliverables.join(", ")}</p>
                  </div>
                )}
                {proposal.optionalExpandedScope && (
                  <div className="p-4 bg-[#fafafb] rounded-xl border border-[#e2e2ea] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111116]">{proposal.optionalExpandedScope.title}</span>
                      <span className="font-mono text-purple-700 font-bold">£{proposal.optionalExpandedScope.investmentGbp.toLocaleString("en-GB")}</span>
                    </div>
                    <p className="text-[#636375] text-[11px]">{proposal.optionalExpandedScope.deliverables.join(", ")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e2e2ea] bg-white flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-[#fafafb] hover:bg-[#f0f0f4] text-[#111116] border border-[#e2e2ea] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-[#636375]" />}
            <span>{copied ? "Copied Proposal" : "Copy Formatted Proposal"}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#111116] text-white hover:bg-[#23232c] text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
