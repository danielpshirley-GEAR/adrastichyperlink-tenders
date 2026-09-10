"use client";

import React from "react";
import { Briefcase, ArrowUpRight, DollarSign, Calendar, Sparkles, Check, ExternalLink } from "lucide-react";

export function RecruitersFreelanceWorkspace() {
  const freelanceContracts = [
    {
      id: "free-1",
      recruiter: "Major Players Creative Staffing",
      role: "Lead 3D Motion Designer (Cinema 4D + Redshift)",
      clientIndustry: "Fintech & Crypto Brand Launch",
      rateGbp: "£500 / Day",
      duration: "4 Weeks (Immediate Start)",
      route: "Daniel P Shirley",
      notes: "High-margin production contract. Direct freelance booking for Daniel.",
    },
    {
      id: "free-2",
      recruiter: "Source Recruitment London",
      role: "Senior Motion Direction & Design System Lead",
      clientIndustry: "Global Automotive Brand",
      rateGbp: "£550 / Day",
      duration: "6 Weeks",
      route: "Daniel P Shirley",
      notes: "Senior stakeholder presentation & campaign motion delivery.",
    },
    {
      id: "free-3",
      recruiter: "Aquent Creative",
      role: "Brand Overhaul & Explainer Package",
      clientIndustry: "HealthTech Scaleup",
      rateGbp: "£14,000 Fixed Project",
      duration: "6 Weeks",
      route: "Adrastichyperlink Studio",
      notes: "Multidisciplinary project remit; recommended routing to Adrastichyperlink Studio.",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-fuchsia-600 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            ENGINE 9 • FREELANCE & RECRUITERS (SECTION 18)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Freelance & Recruiters
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Short-term production cash-flow opportunities routed to Daniel P Shirley or Adrastichyperlink Studio.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Maintains cash flow (£450–£600/day) while building equity in Adrastichyperlink Studio projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 rounded-xl text-xs font-bold shadow-xs">
            Dual Routing Engine Active
          </span>
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {freelanceContracts.map((c) => {
          const isDaniel = c.route === "Daniel P Shirley";
          return (
            <div
              key={c.id}
              className="bg-white border border-[#e5e5eb] rounded-2xl p-6 shadow-xs hover:border-[#cfcfd8] transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-sans text-[#8e919f] font-bold uppercase">
                    {c.recruiter}
                  </span>
                  <span className="text-sm font-bold text-emerald-700 font-mono">
                    {c.rateGbp}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-[#111116] tracking-tight leading-snug">
                  {c.role}
                </h3>
                <div className="text-xs text-[#6b6e7d] font-medium">{c.clientIndustry} • {c.duration}</div>

                <p className="text-xs text-[#4a4d5a] leading-relaxed pt-1">
                  {c.notes}
                </p>
              </div>

              <div className="pt-4 border-t border-[#f1f1f5] flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isDaniel ? "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200" : "bg-[#111116] text-white border-[#111116]"
                }`}>
                  {c.route}
                </span>

                <button className="px-3.5 py-1.5 bg-[#111116] hover:bg-[#23232c] text-white text-xs font-bold rounded-xl transition-all shadow-xs">
                  Respond / Book
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
