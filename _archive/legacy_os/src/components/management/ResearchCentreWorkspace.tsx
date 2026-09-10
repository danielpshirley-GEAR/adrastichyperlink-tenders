"use client";

import React, { useState } from "react";
import { Search, Sparkles, Building2, Shield, ArrowRight, CornerDownLeft } from "lucide-react";

export function ResearchCentreWorkspace() {
  const [targetName, setTargetName] = useState("");
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [researchReport, setResearchReport] = useState<any | null>(null);

  const handleRunInvestigation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetName.trim()) return;

    setIsInvestigating(true);
    setResearchReport(null);

    setTimeout(() => {
      setResearchReport({
        target: targetName,
        whatHappened: `Recent strategic corporate activity detected for ${targetName}. Expansion into new vertical with increased demand for visual communication and technical simplification.`,
        whyNow: "Active product launch timetable combined with creative team bottlenecks.",
        budgetEvidence: "Estimated annual revenue £10M+ with verified marketing expenditure.",
        creativeMaturity: "Current digital presence relies on static photography and text-heavy documentation. Distinct opportunity for high-impact 3D brand motion.",
        targetBuyer: "VP Marketing / Head of Brand Communications",
        recommendedEntry: "Studio Project (£8k–£16k) or Interim Motion Capacity",
        matchedProof: "The Stars Group / PokerStars (Dynamic 3D) & Ministry of Defence (Technical clarity)",
        commercialRisks: "Potential procurement review cycle — ensure direct executive relationship is established early.",
      });
      setIsInvestigating(false);
    }, 500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e2e2ea] pb-6">
        <div>
          <div className="text-[11px] font-sans text-[#636375] uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            SHARED BRAIN • ON-DEMAND AI RESEARCH CENTRE (SECTION 32)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Research Centre
          </h1>
          <p className="text-xs text-[#636375] mt-1 font-medium">
            Manually investigate any target company, sector, competitor, tender, or buyer and receive instant structured studio intelligence.
          </p>
        </div>
      </div>

      {/* Investigation Input Bar */}
      <form
        onSubmit={handleRunInvestigation}
        className="bg-white border border-[#e2e2ea] rounded-2xl p-4 flex items-center gap-3 shadow-xs"
      >
        <Search className="w-4 h-4 text-[#636375]" />
        <input
          type="text"
          placeholder="Enter company name, domain, or prospect (e.g. 'Synthetix Robotics', 'stripe.com')..."
          value={targetName}
          onChange={(e) => setTargetName(e.target.value)}
          className="flex-1 bg-transparent text-sm text-[#111116] placeholder-[#8e919f] focus:outline-none font-sans"
        />
        <button
          type="submit"
          disabled={isInvestigating || !targetName.trim()}
          className="px-5 py-2.5 bg-[#111116] text-white font-bold text-xs rounded-xl hover:bg-[#23232c] transition-colors disabled:opacity-40 flex items-center gap-2 shadow-xs shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>{isInvestigating ? "Investigating..." : "Deep Research"}</span>
        </button>
      </form>

      {/* Intelligence Dossier Output */}
      {researchReport && (
        <div className="bg-white border border-[#e2e2ea] rounded-2xl p-6 space-y-6 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-start justify-between border-b border-[#e2e2ea] pb-4">
            <div>
              <span className="text-[10px] font-sans font-bold text-[#636375] uppercase tracking-wider">
                AI Commercial Dossier
              </span>
              <h2 className="text-2xl font-bold text-[#111116] tracking-tight mt-0.5 studio-display">
                {researchReport.target}
              </h2>
            </div>
            <span className="text-[10px] font-mono px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold uppercase">
              Qualified Prospect
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#fafafb] rounded-xl border border-[#e2e2ea] space-y-1.5">
              <span className="text-[10px] font-sans uppercase text-[#636375] font-bold block tracking-wider">
                What Happened?
              </span>
              <p className="text-[#111116] leading-relaxed font-sans">{researchReport.whatHappened}</p>
            </div>

            <div className="p-4 bg-[#fafafb] rounded-xl border border-[#e2e2ea] space-y-1.5">
              <span className="text-[10px] font-sans uppercase text-[#636375] font-bold block tracking-wider">
                Why Now?
              </span>
              <p className="text-[#111116] leading-relaxed font-sans">{researchReport.whyNow}</p>
            </div>

            <div className="p-4 bg-[#fafafb] rounded-xl border border-[#e2e2ea] space-y-1.5">
              <span className="text-[10px] font-sans uppercase text-[#636375] font-bold block tracking-wider">
                Budget Evidence & Financial Capacity
              </span>
              <p className="text-[#111116] leading-relaxed font-sans">{researchReport.budgetEvidence}</p>
            </div>

            <div className="p-4 bg-[#fafafb] rounded-xl border border-[#e2e2ea] space-y-1.5">
              <span className="text-[10px] font-sans uppercase text-[#636375] font-bold block tracking-wider">
                Observed Creative Maturity
              </span>
              <p className="text-[#111116] leading-relaxed font-sans">{researchReport.creativeMaturity}</p>
            </div>
          </div>

          <div className="p-4 bg-[#fafafb] border border-[#e2e2ea] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-sans uppercase text-blue-700 font-bold block tracking-wider">
                Recommended Service Entry & Matched Proof
              </span>
              <div className="text-[#111116] font-semibold">
                {researchReport.recommendedEntry} • Proof: {researchReport.matchedProof}
              </div>
            </div>

            <button className="px-4 py-2 bg-[#111116] text-white font-bold text-xs rounded-xl hover:bg-[#23232c] transition-colors shrink-0 shadow-xs">
              Create Opportunity From Research
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
