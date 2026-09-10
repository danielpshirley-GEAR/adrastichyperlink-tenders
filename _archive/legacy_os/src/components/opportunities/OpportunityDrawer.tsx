"use client";

import React, { useState } from "react";
import {
  Opportunity,
  PipelineStage,
  LeadFeedback,
} from "@/lib/types";
import {
  X,
  ExternalLink,
  Mail,
  Linkedin,
  PhoneCall,
  Video,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Building2,
  User,
  Sparkles,
  ArrowRight,
  Send,
} from "lucide-react";
import { aiIntelligence } from "@/lib/ai/intelligence";

const DRAWER_FEEDBACK_OPTIONS: {
  id: LeadFeedback;
  label: string;
  activeColor: string;
  defaultColor: string;
}[] = [
  { id: "excellent", label: "Excellent", activeColor: "bg-emerald-600 text-white border-emerald-600", defaultColor: "bg-white text-emerald-800 border-emerald-200 hover:border-emerald-500" },
  { id: "relevant", label: "Relevant", activeColor: "bg-blue-600 text-white border-blue-600", defaultColor: "bg-white text-blue-800 border-blue-200 hover:border-blue-500" },
  { id: "weak", label: "Weak", activeColor: "bg-amber-600 text-white border-amber-600", defaultColor: "bg-white text-amber-800 border-amber-200 hover:border-amber-500" },
  { id: "wrong", label: "Wrong", activeColor: "bg-rose-600 text-white border-rose-600", defaultColor: "bg-white text-rose-800 border-rose-200 hover:border-rose-500" },
  { id: "no_budget", label: "No Budget", activeColor: "bg-purple-600 text-white border-purple-600", defaultColor: "bg-white text-purple-800 border-purple-200 hover:border-purple-500" },
  { id: "wrong_buyer", label: "Wrong Buyer", activeColor: "bg-orange-600 text-white border-orange-600", defaultColor: "bg-white text-orange-800 border-orange-200 hover:border-orange-500" },
  { id: "too_old", label: "Too Old", activeColor: "bg-slate-700 text-white border-slate-700", defaultColor: "bg-white text-slate-700 border-slate-200 hover:border-slate-500" },
  { id: "not_our_work", label: "Not Our Work", activeColor: "bg-stone-800 text-white border-stone-800", defaultColor: "bg-white text-stone-700 border-stone-200 hover:border-stone-500" },
];

interface OpportunityDrawerProps {
  opportunity: Opportunity | null;
  onClose: () => void;
  onMoveStage: (oppId: string, stage: PipelineStage) => void;
  onOpenOutreachModal: (opp: Opportunity, tab?: "email" | "linkedin" | "call") => void;
  onFeedback?: (oppId: string, feedback: LeadFeedback) => void;
}

export function OpportunityDrawer({
  opportunity,
  onClose,
  onMoveStage,
  onOpenOutreachModal,
  onFeedback,
}: OpportunityDrawerProps) {
  if (!opportunity) return null;

  const challengeAdvice = aiIntelligence.getChallengeAdvice(opportunity);
  const stages: { id: PipelineStage; label: string }[] = [
    { id: "discovered", label: "Discovered" },
    { id: "researched", label: "Researched" },
    { id: "qualified", label: "Qualified" },
    { id: "contact_ready", label: "Contact Ready" },
    { id: "contacted", label: "Contacted" },
    { id: "replied", label: "Replied" },
    { id: "meeting_booked", label: "Meeting Booked" },
    { id: "proposal", label: "Proposal" },
    { id: "won", label: "Won" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white border-l border-[#e2e2ea] h-full flex flex-col overflow-hidden shadow-2xl text-[#111116]">
        {/* Header Bar */}
        <div className="p-6 border-b border-[#e2e2ea] flex items-start justify-between bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#636375] uppercase tracking-wider font-semibold">
                {opportunity.acquisitionEngine.replace("_", " ")}
              </span>
              <span className="text-[#8e919f]">•</span>
              <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {opportunity.estimatedValueRange}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#111116] tracking-tight studio-display mt-1">
              {opportunity.company?.name}
            </h2>
            <p className="text-xs text-[#636375] font-medium">{opportunity.title}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#636375] hover:text-[#111116] rounded-lg hover:bg-[#f4f4f7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Score Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#fafafb] p-4 rounded-xl border border-[#e2e2ea]">
            <div>
              <div className="text-[10px] font-sans font-bold text-[#636375] uppercase tracking-wider">
                Action Score
              </div>
              <div className="text-xl font-bold text-[#111116] font-mono mt-0.5 flex items-center gap-1.5">
                {opportunity.actionScore}
                {opportunity.actionScore >= 90 && (
                  <span className="text-[10px] text-rose-600 font-sans font-bold uppercase tracking-wider">URGENT</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-sans font-bold text-[#636375] uppercase tracking-wider">
                Lead Score
              </div>
              <div className="text-xl font-bold text-[#111116] font-mono mt-0.5">
                {opportunity.leadScore}
                <span className="text-xs text-[#8e919f]">/100</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-sans font-bold text-[#636375] uppercase tracking-wider">
                Budget Evidence
              </div>
              <div className="text-xs font-semibold text-[#111116] capitalize mt-1.5">
                {opportunity.budgetConfidence.replace("_", " ")}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-sans font-bold text-[#636375] uppercase tracking-wider">
                Win Probability
              </div>
              <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">
                {opportunity.winProbabilityPercent}%
              </div>
            </div>
          </div>

          {/* Lead Calibration Controls */}
          <div className="p-4 bg-[#f8f8fa] border border-[#e2e2ea] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-bold text-[#111116] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-rose-600" />
                Daniel's Quality Feedback
              </span>
              {opportunity.feedback && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#cfcfda] text-[#111116]">
                  Status: <strong className="text-rose-600 uppercase">{opportunity.feedback.replace("_", " ")}</strong>
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
              {DRAWER_FEEDBACK_OPTIONS.map((opt) => {
                const isSelected = opportunity.feedback === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (onFeedback) {
                        onFeedback(opportunity.id, opt.id);
                      }
                    }}
                    className={`px-2 py-1.5 text-xs font-sans font-bold rounded-lg border transition-all text-center ${
                      isSelected ? opt.activeColor : opt.defaultColor
                    }`}
                  >
                    {isSelected ? `✓ ${opt.label}` : opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Commercial Challenger Notice if any */}
          {challengeAdvice && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                challengeAdvice.level === "urgent"
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : challengeAdvice.level === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-blue-50 border-blue-200 text-blue-900"
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-bold uppercase tracking-wider font-mono">
                  {challengeAdvice.headline}
                </div>
                <p className="leading-relaxed">
                  {challengeAdvice.advice}
                </p>
                <div className="font-bold pt-1">
                  Recommended Move: {challengeAdvice.actionRecommendation}
                </div>
              </div>
            </div>
          )}

          {/* Why Now & Trigger Context */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#636375] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Why Now — Commercial Context
            </h3>
            <div className="bg-[#fafafb] border border-[#e2e2ea] p-4 rounded-xl space-y-2">
              <div className="text-sm font-bold text-[#111116]">
                {opportunity.trigger}
              </div>
              <p className="text-xs text-[#4b4e5d] leading-relaxed">
                {opportunity.needDescription}
              </p>
              <div className="text-[11px] text-[#636375] font-mono pt-1 flex items-center gap-1.5 font-medium">
                <Clock className="w-3 h-3 text-[#8e919f]" />
                Detected: {new Date(opportunity.triggerDate).toLocaleString("en-GB")} ({Math.round(opportunity.triggerFreshnessHours)} hours ago)
              </div>
            </div>
          </div>

          {/* Evidence Chips */}
          {opportunity.evidence && opportunity.evidence.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#636375]">
                Verified Evidence ({opportunity.evidence.length})
              </h3>
              <div className="space-y-2">
                {opportunity.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 bg-[#fafafb] rounded-xl border border-[#e2e2ea] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111116]">{ev.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded uppercase font-semibold">
                        {ev.confidence}
                      </span>
                    </div>
                    <p className="text-[#636375] text-[11px] italic leading-relaxed">
                      "{ev.excerpt}"
                    </p>
                    {ev.sourceUrl && (
                      <a
                        href={ev.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-700 hover:underline pt-1 font-semibold"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buyer Information */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#636375] flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#636375]" />
              Target Decision Maker
            </h3>
            {opportunity.primaryContact ? (
              <div className="bg-[#fafafb] border border-[#e2e2ea] p-4 rounded-xl flex items-start justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-[#111116]">
                    {opportunity.primaryContact.name}
                  </div>
                  <div className="text-xs text-[#636375] font-semibold">
                    {opportunity.primaryContact.jobTitle}
                  </div>
                  {opportunity.primaryContact.email && (
                    <div className="text-xs font-mono text-[#636375]">
                      {opportunity.primaryContact.email}
                    </div>
                  )}
                  {opportunity.primaryContact.notes && (
                    <div className="text-[11px] text-[#4b4e5d] pt-2 leading-relaxed">
                      {opportunity.primaryContact.notes}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold uppercase">
                  {opportunity.primaryContact.roleCategory.replace("_", " ")}
                </span>
              </div>
            ) : (
              <div className="p-4 bg-[#fafafb] border border-[#e2e2ea] rounded-xl text-xs text-[#636375] italic">
                No direct contact identified yet. Recommended action: research CMO / Head of Comms via LinkedIn.
              </div>
            )}
          </div>

          {/* Matched Proof Engine (Verified Client vs Concept Work) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#636375] flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Matched Studio Proof (Section 28)
            </h3>
            <div className="space-y-2">
              {opportunity.matchedProof.map((proof, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#fafafb] border border-[#e2e2ea] rounded-xl text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111116]">{proof.workTitle}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                        proof.isRealClientWork
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-[#636375] border border-slate-200"
                      }`}
                    >
                      {proof.isRealClientWork ? "Real Commercial Client" : "Concept Work"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#636375] leading-relaxed">{proof.relevanceRationale}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline Stage Quick Switcher */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#636375]">
              Update Pipeline Stage
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {stages.map((st) => (
                <button
                  key={st.id}
                  onClick={() => onMoveStage(opportunity.id, st.id)}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors ${
                    opportunity.pipelineStage === st.id
                      ? "bg-[#111116] text-white font-bold"
                      : "bg-[#fafafb] text-[#636375] hover:text-[#111116] border border-[#e2e2ea] hover:bg-white"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Footer Action Buttons */}
        <div className="p-4 border-t border-[#e2e2ea] bg-white flex items-center justify-between gap-2">
          <button
            onClick={() => onMoveStage(opportunity.id, "rejected")}
            className="px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors font-mono font-bold"
          >
            Reject Lead
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenOutreachModal(opportunity, "call")}
              className="px-3 py-2 bg-[#fafafb] hover:bg-[#f0f0f4] text-[#111116] border border-[#e2e2ea] text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#636375]" />
              <span>Call Plan</span>
            </button>
            <button
              onClick={() => onOpenOutreachModal(opportunity, "email")}
              className="px-4 py-2 bg-[#111116] text-white hover:bg-[#23232c] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Compose Outreach</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
