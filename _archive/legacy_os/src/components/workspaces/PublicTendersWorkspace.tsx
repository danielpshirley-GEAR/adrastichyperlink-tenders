"use client";

import React, { useState } from "react";
import { ProcurementTender, SupplierReadinessCheck } from "@/lib/types";
import {
  FileCheck,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Clock,
  Ban,
  Check,
} from "lucide-react";

interface PublicTendersWorkspaceProps {
  tenders: ProcurementTender[];
  readinessChecks: SupplierReadinessCheck[];
}

export function PublicTendersWorkspace({
  tenders,
  readinessChecks,
}: PublicTendersWorkspaceProps) {
  const [selectedTab, setSelectedTab] = useState<
    "all" | "bid" | "high_fit" | "review" | "preparing" | "submitted" | "rejected" | "watchlist"
  >("bid");

  const [selectedTender, setSelectedTender] = useState<ProcurementTender | null>(
    tenders[0] || null
  );

  const [isImproveModalOpen, setIsImproveModalOpen] = useState(false);

  const checks = readinessChecks || [];
  const passedChecksCount = checks.filter((c) => c.passed).length;
  const readinessPercent = checks.length > 0 ? Math.round((passedChecksCount / checks.length) * 100) : 68;

  const filteredTenders = tenders.filter((t) => {
    if (selectedTab === "bid") return t.bidRecommendation === "bid";
    if (selectedTab === "review") return t.bidRecommendation === "review";
    if (selectedTab === "rejected") return t.bidRecommendation === "reject";
    if (selectedTab === "high_fit") return t.capabilityFitScore >= 80;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-blue-600 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <FileCheck className="w-3.5 h-3.5" />
            ENGINE 7 • PUBLIC PROCUREMENT & BID EVALUATION (SECTIONS 15 & 16)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Public Procurement & Tenders
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Central Government, NHS, Council, and Education briefs screened with rigorous Bid / No-Bid logic.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Eliminates speculative pitch churn by matching your evidence checklist and insurance thresholds before you bid.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-[#e5e5eb] rounded-xl text-xs flex items-center gap-2 shadow-xs">
            <span className="text-[#6b6e7d] font-medium">Readiness Index:</span>
            <strong className="text-blue-700 font-bold font-mono text-sm">{readinessPercent}%</strong>
          </div>
        </div>
      </div>

      {/* Permanent Supplier Readiness Dashboard (Section 16) */}
      <div className="bg-white border border-[#e5e5eb] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111116] uppercase tracking-wider font-sans">
                Supplier Readiness Tracker — {readinessPercent}%
              </h3>
              <p className="text-xs text-[#6b6e7d]">
                {passedChecksCount} of {checks.length} essential public procurement mandates currently satisfied.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsImproveModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-xl transition-all shadow-xs"
          >
            Improve Readiness
          </button>
        </div>

        {/* Readiness Matrix Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {checks.map((chk) => (
            <div
              key={chk.id}
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                chk.passed
                  ? "bg-[#fafafb] border-[#e5e5eb] text-[#111116]"
                  : "bg-amber-50/50 border-amber-200 text-[#111116]"
              }`}
            >
              {chk.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5 min-w-0">
                <div className="font-bold text-xs truncate flex items-center justify-between">
                  <span>{chk.label}</span>
                  <span className={chk.passed ? "text-emerald-700" : "text-amber-700 font-bold"}>
                    {chk.passed ? "✓ Satisfied" : "△ Action Needed"}
                  </span>
                </div>
                <div className="text-[11px] text-[#6b6e7d] leading-snug">
                  {chk.details}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tender Intelligence Views Tabs (Section 15) */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#e5e5eb] pb-3">
        {(
          [
            { id: "bid", label: "BID RECOMMENDATION" },
            { id: "high_fit", label: "HIGH FIT" },
            { id: "review", label: "REVIEW" },
            { id: "preparing", label: "PREPARING" },
            { id: "submitted", label: "SUBMITTED" },
            { id: "rejected", label: "REJECTED (AUTO-SCREENED)" },
            { id: "all", label: "ALL TENDERS" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
              selectedTab === t.id
                ? "bg-[#111116] text-white shadow-xs"
                : "text-[#6b6e7d] hover:text-[#111116] bg-[#f4f4f7]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tender Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Tender List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredTenders.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#e5e5eb] rounded-2xl text-xs text-[#6b6e7d]">
              No tenders match this filter.
            </div>
          ) : (
            filteredTenders.map((t) => {
              const isSelected = t.id === selectedTender?.id;
              const isBid = t.bidRecommendation === "bid";
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTender(t)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-white border-blue-600 shadow-md ring-1 ring-blue-600/20"
                      : "bg-white border-[#e5e5eb] hover:border-[#cfcfd8] shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-[9px] font-sans uppercase font-bold px-2 py-0.5 rounded ${
                          isBid
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {isBid ? "BID RECOMMENDATION" : "NO-BID / PASS"}
                      </span>
                      <h4 className="font-extrabold text-sm text-[#111116] mt-1.5">
                        {t.title}
                      </h4>
                      <p className="text-xs text-[#6b6e7d] mt-0.5">{t.buyerName}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-mono font-extrabold text-blue-700">
                        {t.bidScore}
                      </div>
                      <div className="text-[9px] text-[#8e919f] font-sans uppercase">
                        Bid Score
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#f1f1f5] text-xs">
                    <span className="font-bold text-[#111116] font-mono">
                      {t.valueDisplay}
                    </span>
                    <span className="text-[#6b6e7d] text-[11px]">
                      Closes: {t.submissionDeadline}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Tender Intelligence Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#e5e5eb] rounded-2xl p-7 space-y-6 shadow-xs">
          {selectedTender ? (
            <>
              {/* Header */}
              <div className="border-b border-[#f1f1f5] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {(selectedTender.buyerType || "public").replace("_", " ").toUpperCase()}
                    </span>
                    <span className="text-[#6b6e7d]">•</span>
                    <span className="font-mono font-bold text-[#111116]">
                      {selectedTender.valueDisplay}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#111116] tracking-tight">
                    {selectedTender.title}
                  </h3>
                  <div className="text-xs text-[#6b6e7d]">
                    Procuring Authority: <strong className="text-[#111116]">{selectedTender.buyerName}</strong>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <a
                    href={selectedTender.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#f4f4f7] hover:bg-[#e9e9ee] text-[#111116] rounded-xl text-xs font-bold transition-colors border border-[#e5e5eb] flex items-center gap-1.5"
                  >
                    <span>View Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Scope & Strategic Match */}
              <div className="space-y-2">
                <span className="text-[10px] font-sans uppercase text-[#8e919f] font-bold tracking-wider block">
                  Procurement Scope & Brief
                </span>
                <p className="text-xs text-[#2b2b34] leading-relaxed font-medium bg-[#f8f8fa] p-4 rounded-xl border border-[#e5e5eb]">
                  {selectedTender.notes || selectedTender.recommendationRationale}
                </p>
              </div>

              {/* Mandates Satisfied vs Lacked */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-sans uppercase text-emerald-800 font-bold block">
                    Evidence Adrastichyperlink Has (✓)
                  </span>
                  <ul className="text-xs text-[#111116] space-y-1">
                    {selectedTender.mandatoryRequirements.slice(0, 3).map((req, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-sans uppercase text-amber-800 font-bold block">
                    Evidence Gaps & Considerations (△)
                  </span>
                  <p className="text-xs text-[#4a4d5a] leading-relaxed">
                    {selectedTender.bidScore < 80
                      ? "Turnover requirement restricts solo prime bidding. Consortium partner or subcontractor status recommended."
                      : "All primary thresholds satisfied. Cyber Essentials verification and MoD case study proof attachable."}
                  </p>
                </div>
              </div>

              {/* AI Bid Rationale */}
              <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-sans uppercase text-blue-900 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                  Commercial Bid Rationale
                </span>
                <p className="text-xs text-[#111116] leading-relaxed font-medium">
                  {selectedTender.recommendationRationale}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button className="px-4 py-2 bg-white hover:bg-slate-100 text-[#4a4d5a] font-bold text-xs rounded-xl transition-colors border border-[#e5e5eb]">
                  Pass / Archive
                </button>
                <button className="px-5 py-2 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Prepare Tender Submission</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-[#6b6e7d]">
              Select a tender to view evaluation matrix.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
