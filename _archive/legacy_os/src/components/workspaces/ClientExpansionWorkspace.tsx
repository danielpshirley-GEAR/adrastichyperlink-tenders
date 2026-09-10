"use client";

import React from "react";
import { ClientAccount } from "@/lib/types";
import { Award, ArrowUpRight, ArrowRight, CheckCircle2, Calendar, Sparkles, RefreshCw, Users, HeartHandshake, MessageSquare } from "lucide-react";

interface ClientExpansionWorkspaceProps {
  clients: ClientAccount[];
}

export function ClientExpansionWorkspace({
  clients,
}: ClientExpansionWorkspaceProps) {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-amber-600 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Award className="w-3.5 h-3.5" />
            GROWTH • CLIENT EXPANSION & RETAINER RADAR (SECTION 20)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Client Expansion & Retainers
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Turn every successful project into: Next Scope + Monthly Retainer + Case Study + Structured Referral.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Existing clients are the highest-margin lead-generation source.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold shadow-xs">
            Compounding Revenue Engine
          </span>
        </div>
      </div>

      {/* AI Provocation Banner (Section 20) */}
      <div className="p-5 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 border border-amber-200 rounded-2xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-extrabold text-[#111116] uppercase tracking-wider">
            AI Expansion Prompt: "What else could we genuinely help this organisation with?"
          </span>
          <p className="text-[#4a4d5a] leading-relaxed">
            Monitor client product launches, subsequent funding rounds, and other departments (Internal Comms, HR, People, Transformation) to propose natural next-stage scopes.
          </p>
        </div>
      </div>

      {/* Client Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clients.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-white border border-[#e5e5eb] rounded-2xl space-y-3">
            <h3 className="text-base font-bold text-[#111116]">No Active Client Accounts Yet</h3>
            <p className="text-xs text-[#6b6e7d] max-w-md mx-auto">
              Win your first paying project via Active Buyers, Business Signals, or Agency Overflow to unlock client expansion compounding.
            </p>
          </div>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              className="bg-white border border-[#e5e5eb] rounded-2xl p-7 space-y-5 shadow-xs hover:border-[#cfcfd8] transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#111116] tracking-tight">
                      {client.companyName}
                    </h3>
                    <div className="text-xs text-[#6b6e7d]">
                      Account Lead: <strong className="text-[#111116]">{client.primaryContactName}</strong>
                    </div>
                  </div>

                  <span className="text-[10px] font-sans px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold uppercase">
                    {client.relationshipHealth.replace("_", " ")}
                  </span>
                </div>

                {/* Follow-On Scope Hero Box */}
                <div className="p-4 bg-[#fafafb] border border-amber-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans uppercase text-amber-800 font-bold">
                      Identified Follow-On Scope
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 capitalize font-bold">
                      {client.retainerPotential.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-[#111116] text-sm font-bold">
                    {client.nextOpportunityIdentified}
                  </div>
                </div>

                {/* Asset Checklist (Testimonial, Case Study, Referral) */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="p-2.5 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb]">
                    <span className="text-[9px] text-[#8e919f] uppercase block font-bold">Testimonial</span>
                    <span className="font-bold text-emerald-700 capitalize mt-0.5 block">
                      {client.testimonialStatus.replace("_", " ")}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb]">
                    <span className="text-[9px] text-[#8e919f] uppercase block font-bold">Case Study</span>
                    <span className="font-bold text-emerald-700 capitalize mt-0.5 block">
                      {client.caseStudyStatus.replace("_", " ")}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb]">
                    <span className="text-[9px] text-[#8e919f] uppercase block font-bold">Referral Ask</span>
                    <span className="font-bold text-blue-700 capitalize mt-0.5 block">
                      {client.referralStatus.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-[#f1f1f5] flex items-center justify-between">
                <span className="text-xs text-[#6b6e7d]">
                  Next Touchpoint: {client.nextCheckInAt?.split("T")[0] || "Next week"}
                </span>

                <button className="px-4 py-2 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5">
                  <span>Propose Retainer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
