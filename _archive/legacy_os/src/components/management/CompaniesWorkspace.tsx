"use client";

import React, { useState } from "react";
import { Company } from "@/lib/types";
import { Building2, Search, ExternalLink, Layers, CheckCircle2 } from "lucide-react";

interface CompaniesWorkspaceProps {
  companies: Company[];
}

export function CompaniesWorkspace({ companies }: CompaniesWorkspaceProps) {
  const [query, setQuery] = useState("");

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.industry.toLowerCase().includes(query.toLowerCase()) ||
      c.location.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-slate-700 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Building2 className="w-3.5 h-3.5" />
            SHARED BRAIN • CANONICAL COMPANIES DIRECTORY (SECTION 3)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Companies Brain
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Single canonical company database. Multiple acquisition signals stack onto one account.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Never duplicate leads; compound commercial confidence from independent discovery engines.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e919f]" />
          <input
            type="text"
            placeholder="Search companies, sectors, locations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-[#e5e5eb] rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#111116] placeholder-[#8e919f] focus:outline-none focus:border-[#111116] shadow-xs"
          />
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((company) => {
          const stacks = company.signalStack || [];
          return (
            <div
              key={company.id}
              className="bg-white border border-[#e5e5eb] rounded-2xl p-7 shadow-xs hover:border-[#cfcfd8] transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 uppercase">
                      {company.companyType}
                    </span>
                    <span className="text-xs text-[#6b6e7d]">{company.location}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#111116] tracking-tight">
                    {company.name}
                  </h3>
                  <div className="text-xs text-[#6b6e7d]">{company.industry}</div>
                </div>

                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-[#8e919f] hover:text-[#111116] rounded-xl hover:bg-[#f1f1f5] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <p className="text-xs text-[#4a4d5a] leading-relaxed">
                {company.summary}
              </p>

              {/* Stacked Signals Preview */}
              {stacks.length > 0 && (
                <div className="p-3 bg-[#f8f8fa] border border-[#e5e5eb] rounded-xl space-y-1 text-xs">
                  <span className="text-[10px] font-sans uppercase font-bold text-[#8e919f] block">
                    Stacked Discovery Signals ({stacks.length})
                  </span>
                  <div className="text-xs text-[#111116] space-y-0.5">
                    {stacks.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                        <span className="font-medium">{s.headline}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 bg-[#f8f8fa] p-3 rounded-xl border border-[#e5e5eb] text-center text-xs pt-1">
                <div>
                  <span className="text-[9px] text-[#8e919f] font-sans uppercase font-bold block">Revenue</span>
                  <span className="font-bold text-[#111116]">{company.estimatedAnnualRevenueGbp}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#8e919f] font-sans uppercase font-bold block">Creative Team</span>
                  <span className="font-bold text-[#111116]">{company.creativeTeamSize} staff</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#8e919f] font-sans uppercase font-bold block">Maturity Gap</span>
                  <span className="font-bold text-amber-700 capitalize">{company.creativeMaturityRating.replace("_", " ")}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
