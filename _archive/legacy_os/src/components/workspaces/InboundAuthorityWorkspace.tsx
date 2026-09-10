"use client";

import React from "react";
import { Sparkles, Globe, FileText, Award, ArrowUpRight, CheckCircle2 } from "lucide-react";

export function InboundAuthorityWorkspace() {
  const inboundSources = [
    { source: "Direct Studio Website (adrastichyperlink.com)", inquiriesCount: 9, convertedWins: 2, revenueWonGbp: 22000 },
    { source: "LinkedIn Thought Leadership & Showreels", inquiriesCount: 7, convertedWins: 2, revenueWonGbp: 18500 },
    { source: "Organic Search & Creative Directories", inquiriesCount: 4, convertedWins: 1, revenueWonGbp: 12000 },
    { source: "Client & Multiplier Referrals", inquiriesCount: 5, convertedWins: 3, revenueWonGbp: 34000 },
  ];

  const authorityAssets = [
    {
      title: "Commercial 3D Motion in High-Stakes HealthTech & Surgical AI",
      type: "Executive Case Study",
      status: "Published",
      impact: "Used as primary credibility anchor in active buyer outreach",
    },
    {
      title: "Why Most Internal Transformation Programs Fail at Information Design",
      type: "Strategic Studio Essay",
      status: "In Progress",
      impact: "Targeting Transformation Directors & Corporate Comms leaders",
    },
    {
      title: "The Motion Design Capacity Gap in High-Growth Scaleups",
      type: "Showcase Case Analysis",
      status: "Published",
      impact: "Generated 3 warm inbound inquiries from Series A founders",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-lime-600 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            GROWTH • INBOUND & STUDIO AUTHORITY
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Inbound & Studio Authority
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Build conviction and inbound inquiries through high-craft case studies, published essays, and SEO authority.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Validates Daniel's credibility when prospects research Adrastichyperlink after receiving cold outreach.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-lime-50 text-lime-800 border border-lime-200 rounded-xl text-xs font-bold shadow-xs">
            Conviction Engine Active
          </span>
        </div>
      </div>

      {/* Inbound Conversion Channels */}
      <div className="bg-white border border-[#e5e5eb] rounded-2xl p-7 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#111116] uppercase font-sans tracking-wider">
          Inbound Conversion Channels
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {inboundSources.map((s, i) => (
            <div
              key={i}
              className="p-4 bg-[#f8f8fa] border border-[#e5e5eb] rounded-xl space-y-1.5 text-xs"
            >
              <div className="font-bold text-[#111116]">{s.source}</div>
              <div className="text-[#6b6e7d] text-[11px]">
                {s.inquiriesCount} inquiries • {s.convertedWins} wins
              </div>
              <div className="text-sm font-mono font-bold text-emerald-700 pt-1">
                £{s.revenueWonGbp.toLocaleString("en-GB")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Authority Building Assets */}
      <div className="bg-white border border-[#e5e5eb] rounded-2xl p-7 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#111116] uppercase font-sans tracking-wider">
          Studio Authority Assets Pipeline
        </h3>
        <div className="space-y-3">
          {authorityAssets.map((asset, i) => (
            <div
              key={i}
              className="p-4 bg-[#f8f8fa] border border-[#e5e5eb] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#111116] font-bold text-sm">{asset.title}</span>
                  <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-white border border-[#e5e5eb] text-[#6b6e7d] uppercase font-semibold">
                    {asset.type}
                  </span>
                </div>
                <p className="text-[#6b6e7d] text-[11px]">{asset.impact}</p>
              </div>

              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold shrink-0">
                {asset.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
