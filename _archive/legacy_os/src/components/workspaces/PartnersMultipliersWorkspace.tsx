"use client";

import React, { useState } from "react";
import { RelationshipPartner } from "@/lib/types";
import { Share2, Building2, Users, ArrowUpRight, DollarSign, Calendar, Sparkles } from "lucide-react";

interface PartnersMultipliersWorkspaceProps {
  relationships: RelationshipPartner[];
}

export function PartnersMultipliersWorkspace({
  relationships,
}: PartnersMultipliersWorkspaceProps) {
  const [selectedType, setSelectedType] = useState<string>("all");

  const types = [
    { id: "all", label: "All Multipliers" },
    { id: "vc_pe", label: "VC & PE Firms" },
    { id: "fractional_cmo", label: "Fractional CMOs" },
    { id: "consultant", label: "Consultants & Advisers" },
    { id: "developer", label: "Web Developers" },
    { id: "pr", label: "PR Agencies" },
    { id: "recruiter", label: "Recruiters" },
    { id: "introducer", label: "Introducers" },
  ];

  const filtered = relationships.filter((r) => {
    if (selectedType === "all") return true;
    return r.partnerType === selectedType;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-rose-600 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Share2 className="w-3.5 h-3.5" />
            ENGINE 10 • PARTNERS & MULTIPLIERS (SECTION 19)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Partners & Multipliers
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            VCs, PE firms, Fractional CMOs, PR agencies, and Introducers who expose Adrastichyperlink to dozens of clients.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Borrow distribution and senior trust instead of cold prospecting alone.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold shadow-xs">
            Network Reach: ~85 Target Accounts
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#e5e5eb] pb-3">
        {types.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedType(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${
              selectedType === t.id
                ? "bg-[#111116] text-white shadow-xs"
                : "text-[#6b6e7d] hover:text-[#111116] bg-[#f4f4f7]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Multiplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((partner) => (
          <div
            key={partner.id}
            className="bg-white border border-[#e5e5eb] rounded-2xl p-7 shadow-xs hover:border-[#cfcfd8] transition-all space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-sans text-rose-600 uppercase font-bold tracking-wider">
                  {partner.partnerType.replace("_", " ")}
                </span>
                <h3 className="text-xl font-extrabold text-[#111116] tracking-tight">
                  {partner.name}
                </h3>
                <div className="text-xs text-[#6b6e7d]">
                  Key Contact: <strong className="text-[#111116]">{partner.contactName}</strong> • {partner.role}
                </div>
              </div>

              <span className="text-[10px] font-sans px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase font-bold">
                {partner.relationshipStrength.replace("_", " ")}
              </span>
            </div>

            {/* Access and Attributed Metrics (Section 19) */}
            <div className="grid grid-cols-3 gap-3 bg-[#f8f8fa] p-4 rounded-xl border border-[#e5e5eb] text-center text-xs">
              <div>
                <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                  Portfolio Access
                </span>
                <span className="font-bold text-[#111116] text-sm">
                  {partner.companiesRepresentedCount} Companies
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                  Introductions
                </span>
                <span className="font-bold text-sky-700 text-sm">
                  {partner.introductionsCount} Leads
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                  Revenue Attributed
                </span>
                <span className="font-bold text-emerald-700 text-sm font-mono">
                  £{(partner.attributedRevenueGbp || 0).toLocaleString("en-GB")}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-sans uppercase text-[#8e919f] font-bold block">
                Next Strategic Action:
              </span>
              <p className="text-[#111116] font-medium leading-relaxed">
                {partner.nextAction || "Schedule bi-monthly check-in to review portfolio creative requirements."}
              </p>
            </div>

            <div className="pt-3 border-t border-[#f1f1f5] flex items-center justify-between">
              <span className="text-xs text-[#6b6e7d]">
                Touch Due: {partner.nextActionDeadline || "Next 7 Days"}
              </span>

              <button className="px-3.5 py-1.5 bg-[#111116] hover:bg-[#23232c] text-white text-xs font-bold rounded-xl transition-all shadow-xs">
                Log Conversation
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
