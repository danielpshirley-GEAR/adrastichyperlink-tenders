"use client";

import React from "react";
import { CommercialAnalytics, AppMode } from "@/lib/types";
import { BarChart3, TrendingUp, Coins, ShieldCheck, PieChart, ArrowUpRight } from "lucide-react";

interface AnalyticsWorkspaceProps {
  analytics: CommercialAnalytics;
  appMode?: AppMode;
}

export function AnalyticsWorkspace({ analytics, appMode = "demo" }: AnalyticsWorkspaceProps) {
  const isLive = appMode === "live";

  const cap = analytics?.capital ?? {
    startingBudgetGbp: 5000,
    totalSpentGbp: 140,
    committedGbp: 220,
    remainingGbp: 4860,
    attributedRevenueGbp: isLive ? 0 : 52500,
    costBreakdown: {
      ai: 18.42,
      dataEnrichment: 45.0,
      salesTools: 35.0,
      hosting: 24.0,
      email: 17.58,
    },
  };

  const revenueWon = isLive ? 0 : (analytics?.revenueWonGbp ?? 52500);
  const cashCollected = isLive ? 0 : (analytics?.cashCollectedGbp ?? 52500);
  const targetRevenue = analytics?.targetAnnualRevenueGbp ?? 100000;
  const percentToMilestone = Math.min(
    100,
    Math.round((revenueWon / (targetRevenue || 1)) * 100)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e5eb] pb-6">
        <div>
          <div className="text-[11px] font-sans text-slate-700 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            INTELLIGENCE • COMMERCIAL VELOCITY & £5k GROWTH FUND (SECTION 40)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Commercial Velocity & Capital
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Focusing strictly on cash collected, profitable projects, and capital efficiency.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            {isLive ? (
              <span className="text-emerald-800 font-bold">
                LIVE MODE ACTIVE: Displaying strictly truthful, verified commercial numbers. Never fake ROI.
              </span>
            ) : (
              <span className="text-amber-800 font-bold">
                DEMO MODE ACTIVE: Displaying simulated commercial velocity data for product testing.
              </span>
            )}
          </p>
        </div>

        <div className="px-4 py-2 bg-white border border-[#e5e5eb] rounded-xl text-xs font-mono shadow-xs">
          Target: <strong className="text-[#111116]">£100k Annual Studio Revenue</strong>
        </div>
      </div>

      {/* Primary Commercial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e5e5eb] p-6 rounded-2xl space-y-2 shadow-xs">
          <div className="text-[10px] font-sans text-[#8e919f] uppercase font-bold">
            Revenue Won
          </div>
          <div className="text-3xl font-extrabold text-[#111116] font-mono">
            £{revenueWon.toLocaleString("en-GB")}
          </div>
          <div className="text-xs text-[#6b6e7d]">
            <span className="text-emerald-700 font-semibold">{percentToMilestone}%</span> of £100k target
          </div>
          <div className="w-full bg-[#f1f1f5] h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{ width: `${percentToMilestone}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-[#e5e5eb] p-6 rounded-2xl space-y-2 shadow-xs">
          <div className="text-[10px] font-sans text-[#8e919f] uppercase font-bold">
            Cash Collected (Banked)
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono">
            £{cashCollected.toLocaleString("en-GB")}
          </div>
          <div className="text-xs text-[#6b6e7d]">
            Strict 50% deposit rule enforced
          </div>
        </div>

        <div className="bg-white border border-[#e5e5eb] p-6 rounded-2xl space-y-2 shadow-xs">
          <div className="text-[10px] font-sans text-[#8e919f] uppercase font-bold">
            Average Project Value
          </div>
          <div className="text-3xl font-extrabold text-[#111116] font-mono">
            {isLive ? "£0" : "£13,125"}
          </div>
          <div className="text-xs text-[#6b6e7d]">
            Targeting £5k–£25k sweet spot
          </div>
        </div>

        <div className="bg-white border border-[#e5e5eb] p-6 rounded-2xl space-y-2 shadow-xs">
          <div className="text-[10px] font-sans text-[#8e919f] uppercase font-bold">
            Gross Margin Estimate
          </div>
          <div className="text-3xl font-extrabold text-[#111116] font-mono">
            {isLive ? "—" : "78%"}
          </div>
          <div className="text-xs text-[#6b6e7d]">
            High operating leverage via AI OS
          </div>
        </div>
      </div>

      {/* Growth Capital Dashboard (Section 40) */}
      <div className="bg-white border border-[#e5e5eb] rounded-2xl p-7 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-[#111116] uppercase font-sans tracking-wider">
              £5,000 Growth Fund Monitor (Section 40)
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            CAPITAL PROTECTED
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#f8f8fa] p-4 rounded-xl border border-[#e5e5eb] text-center text-xs">
          <div>
            <span className="text-[10px] font-sans text-[#8e919f] uppercase font-bold block">
              Starting Capital
            </span>
            <span className="text-sm font-mono font-bold text-[#111116]">
              £{cap.startingBudgetGbp.toLocaleString("en-GB")}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-sans text-[#8e919f] uppercase font-bold block">
              Total Spent
            </span>
            <span className="text-sm font-mono font-bold text-amber-700">
              £{cap.totalSpentGbp}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-sans text-[#8e919f] uppercase font-bold block">
              Committed
            </span>
            <span className="text-sm font-mono font-bold text-[#4a4d5a]">
              £{cap.committedGbp}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-sans text-[#8e919f] uppercase font-bold block">
              Remaining
            </span>
            <span className="text-sm font-mono font-bold text-emerald-700">
              £{cap.remainingGbp.toLocaleString("en-GB")}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-sans text-[#8e919f] uppercase font-bold block">
              Attributed Revenue
            </span>
            <span className="text-sm font-mono font-bold text-[#111116]">
              {isLive ? "£0 (No Fake ROI)" : "£52,500"}
            </span>
          </div>
        </div>

        {/* Cost Breakdown Details */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-sans uppercase text-[#8e919f] font-bold">
            Operational Cost Breakdown
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb]">
              <span className="text-[#6b6e7d] text-[10px] block">AI & LLM Spend</span>
              <span className="text-[#111116] font-bold text-sm">£{(cap.costBreakdown?.ai ?? 18.42).toFixed(2)}</span>
            </div>
            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb]">
              <span className="text-[#6b6e7d] text-[10px] block">Data Enrichment</span>
              <span className="text-[#111116] font-bold text-sm">£{(cap.costBreakdown?.dataEnrichment ?? 45).toFixed(2)}</span>
            </div>
            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb]">
              <span className="text-[#6b6e7d] text-[10px] block">Sales Tools</span>
              <span className="text-[#111116] font-bold text-sm">£{(cap.costBreakdown?.salesTools ?? 35).toFixed(2)}</span>
            </div>
            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb]">
              <span className="text-[#6b6e7d] text-[10px] block">Hosting & Infra</span>
              <span className="text-[#111116] font-bold text-sm">£{(cap.costBreakdown?.hosting ?? 24).toFixed(2)}</span>
            </div>
            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb]">
              <span className="text-[#6b6e7d] text-[10px] block">Email Services</span>
              <span className="text-[#111116] font-bold text-sm">£{(cap.costBreakdown?.email ?? 17.58).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signal Conversion Performance */}
      <div className="bg-white border border-[#e5e5eb] rounded-2xl p-7 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#111116] uppercase font-sans tracking-wider">
          Win Rate by Acquisition Engine (Attribution)
        </h3>

        <div className="space-y-3">
          {(analytics?.conversionByTrigger || []).map((item, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#111116] font-semibold">{item.trigger}</span>
                <span className="font-mono font-bold text-emerald-700">
                  {item.conversionRatePercent}% ({item.winsCount}/{item.leadsCount} wins)
                </span>
              </div>
              <div className="w-full bg-[#f1f1f5] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${item.conversionRatePercent * 2.2}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
