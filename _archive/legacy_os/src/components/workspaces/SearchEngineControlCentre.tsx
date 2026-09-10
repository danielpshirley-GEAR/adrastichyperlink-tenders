"use client";

import React, { useState } from "react";
import {
  Radio,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Coins,
  Cpu,
  Layers,
  Flame,
  TrendingUp,
  Building2,
  FileCheck,
  Search,
} from "lucide-react";

interface SearchEngineStatus {
  id: string;
  name: string;
  category: string;
  status: "active" | "scanning" | "idle";
  lastScan: string;
  nextScheduled: string;
  sources: string[];
  queriesSample: string;
  discoveriesFound: number;
  qualifiedCount: number;
  rejectedCount: number;
  aiCostGbp: number;
  errorsCount: number;
}

export function SearchEngineControlCentre() {
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [activeScannerName, setActiveScannerName] = useState<string | null>(null);
  const [scanConsoleOutput, setScanConsoleOutput] = useState<string[]>([]);

  const [engines, setEngines] = useState<SearchEngineStatus[]>([
    {
      id: "eng-1",
      name: "Active Buyers Scanner",
      category: "active_demand",
      status: "active",
      lastScan: "16:42 Today",
      nextScheduled: "17:42 (Hourly)",
      sources: ["LinkedIn Posts", "X/Twitter Agency Search", "Creative Community Slacks", "Design Roster Boards"],
      queriesSample: '"looking for motion studio", "recommend branding agency", "3D animation partner"',
      discoveriesFound: 21,
      qualifiedCount: 3,
      rejectedCount: 18,
      aiCostGbp: 0.31,
      errorsCount: 0,
    },
    {
      id: "eng-2",
      name: "Business Signals & Stacking",
      category: "business_signals",
      status: "active",
      lastScan: "12:00 Today",
      nextScheduled: "16:00 & 07:00",
      sources: ["Companies House Filings", "TechCrunch Europe", "Sifted Funding Data", "LinkedIn Leadership Appointments"],
      queriesSample: 'Series A/B funding £3m+, CMO hire, UK/Nordic expansion announcements',
      discoveriesFound: 48,
      qualifiedCount: 6,
      rejectedCount: 42,
      aiCostGbp: 0.84,
      errorsCount: 0,
    },
    {
      id: "eng-3",
      name: "Internal Needs & Transformation",
      category: "internal_needs",
      status: "active",
      lastScan: "07:00 Today",
      nextScheduled: "07:00 Tomorrow",
      sources: ["FT Transformation Reports", "Personnel Today", "Corporate Governance Bulletins", "Executive Change Portals"],
      queriesSample: 'Operating model overhaul, merger integration comms, L&D platform rollout',
      discoveriesFound: 14,
      qualifiedCount: 3,
      rejectedCount: 11,
      aiCostGbp: 0.42,
      errorsCount: 0,
    },
    {
      id: "eng-4",
      name: "In-House Capacity Deficit Engine",
      category: "in_house_capacity",
      status: "active",
      lastScan: "12:00 Today",
      nextScheduled: "16:00 Today",
      sources: ["LinkedIn Jobs", "Indeed Creative", "Otta Scaleups", "Creativepool Vacancies"],
      queriesSample: 'Senior Motion Designer open 60+ days, ratio 10+ marketers to 0 motion staff',
      discoveriesFound: 32,
      qualifiedCount: 4,
      rejectedCount: 28,
      aiCostGbp: 0.55,
      errorsCount: 0,
    },
    {
      id: "eng-5",
      name: "Public Tenders & Procurement Scanner",
      category: "public_tenders",
      status: "active",
      lastScan: "12:00 Today",
      nextScheduled: "16:00 Today",
      sources: ["Contracts Finder UK", "Find a Tender Service", "Crown Commercial Service DPS", "Sell2Wales"],
      queriesSample: 'Animation, video production, public education motion, branding frameworks £15k–£100k',
      discoveriesFound: 19,
      qualifiedCount: 1,
      rejectedCount: 18,
      aiCostGbp: 0.38,
      errorsCount: 0,
    },
  ]);

  const handleRunSearch = (engineName: string) => {
    setIsLiveScanning(true);
    setActiveScannerName(engineName);
    setScanConsoleOutput([
      `Initiating ${engineName}...`,
      "Checking 34 verified external sources...",
    ]);

    setTimeout(() => {
      setScanConsoleOutput((prev) => [
        ...prev,
        "Running AI Semantic Filter: rejecting unviable budgets (<£3k) and unrelated generalist RFPs...",
      ]);
    }, 1200);

    setTimeout(() => {
      setScanConsoleOutput((prev) => [
        ...prev,
        "Found 6 raw signals • 1 strong opportunity qualified • 5 weak prospects rejected automatically.",
        "Scan complete. Data synchronised to canonical brain.",
      ]);
      setIsLiveScanning(false);
    }, 2600);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-slate-700 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-600" />
            INTELLIGENCE • SEARCH ENGINES & CADENCE (SECTIONS 21, 22, 23)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Search Engine Control Centre
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Background discovery scanners operating continuously even when you are offline.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Monitors live intent, parses signals, rejects noise, and protects your £5,000 growth fund with strict research tiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRunSearch("All Discovery Engines")}
            disabled={isLiveScanning}
            className="px-4 py-2 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLiveScanning ? "animate-spin" : ""}`} />
            <span>{isLiveScanning ? "Scanning Web & Signals..." : "Run All Scanners Now"}</span>
          </button>
        </div>
      </div>

      {/* Live Scanning Console Banner (Section 22) */}
      {isLiveScanning && (
        <div className="p-5 bg-[#111116] text-white rounded-2xl border border-[#2a2a34] shadow-lg space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-2 text-rose-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              SEARCHING NOW: {activeScannerName}
            </span>
            <span className="text-[11px] text-[#9da1b0] font-mono">AI Token Cost: ~£0.04</span>
          </div>
          <div className="space-y-1 font-mono text-xs text-[#e2e2ea]">
            {scanConsoleOutput.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-emerald-400">›</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Engine Cards Grid (Section 21) */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#111116]">
          Autonomous Discovery Engines
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {engines.map((eng) => (
            <div
              key={eng.id}
              className="bg-white border border-[#e5e5eb] rounded-2xl p-6 shadow-xs hover:border-[#cfcfd8] transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#f1f1f5] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase font-mono">
                      {eng.status}
                    </span>
                    <span className="text-[#6b6e7d]">•</span>
                    <span className="text-xs text-[#6b6e7d]">
                      Next Scan: <strong className="text-[#111116]">{eng.nextScheduled}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#111116] tracking-tight">
                    {eng.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunSearch(eng.name)}
                    disabled={isLiveScanning}
                    className="px-3 py-1.5 bg-[#f4f4f7] hover:bg-[#e9e9ee] text-[#111116] font-bold text-xs rounded-xl transition-colors border border-[#e5e5eb] flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-[#111116]" />
                    <span>Run Now</span>
                  </button>
                  <button className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#4a4d5a] font-bold text-xs rounded-xl transition-colors border border-[#e5e5eb]">
                    Configure
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#f8f8fa] p-3.5 rounded-xl border border-[#e5e5eb] text-center text-xs">
                <div>
                  <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                    Last Scan
                  </span>
                  <span className="font-bold text-[#111116]">{eng.lastScan}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                    Signals Found
                  </span>
                  <span className="font-bold text-[#111116] font-mono">{eng.discoveriesFound}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                    Qualified
                  </span>
                  <span className="font-bold text-emerald-700 font-mono">{eng.qualifiedCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                    Rejected
                  </span>
                  <span className="font-bold text-slate-500 font-mono">{eng.rejectedCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8e919f] font-sans uppercase font-bold block">
                    Scan Cost
                  </span>
                  <span className="font-bold text-indigo-700 font-mono">£{eng.aiCostGbp.toFixed(2)}</span>
                </div>
              </div>

              {/* Monitored Sources & Queries */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6b6e7d]">
                <div>
                  <span className="font-bold text-[#111116]">Sources: </span>
                  <span>{eng.sources.join(", ")}</span>
                </div>
                <div>
                  <span className="font-bold text-[#111116]">Queries: </span>
                  <span className="font-mono text-[11px]">{eng.queriesSample}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cadence Schedule Matrix & Research Tiers (Section 23 & 24) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cadence */}
        <div className="bg-white border border-[#e5e5eb] rounded-2xl p-6 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111116] font-sans">
            Scheduled Automated Cadence (Section 23)
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] flex items-center justify-between">
              <span className="font-bold text-rose-700">HOURLY</span>
              <span className="text-[#6b6e7d]">Active buyers, explicit requests, urgent demand</span>
            </div>
            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] flex items-center justify-between">
              <span className="font-bold text-sky-700">07:00 DAILY</span>
              <span className="text-[#6b6e7d]">Business signals, internal needs, capacity vacancies</span>
            </div>
            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] flex items-center justify-between">
              <span className="font-bold text-amber-700">12:00 MIDDAY</span>
              <span className="text-[#6b6e7d]">Active buyer refresh, commissions, tenders</span>
            </div>
            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] flex items-center justify-between">
              <span className="font-bold text-violet-700">16:00 AFTERNOON</span>
              <span className="text-[#6b6e7d]">Agency developments, new creative contracts</span>
            </div>
            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] flex items-center justify-between">
              <span className="font-bold text-slate-800">NIGHT RUN</span>
              <span className="text-[#6b6e7d]">Deep enrichment, deduplication, lead rescoring</span>
            </div>
          </div>
        </div>

        {/* Research Tiers (Section 24) */}
        <div className="bg-white border border-[#e5e5eb] rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111116] font-sans">
              4-Tier Research Cost Protection (Section 24)
            </h3>
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              £5,000 FUND PROTECTED
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#111116] block">Tier 1: Discovery</span>
                <span className="text-[#6b6e7d] text-[11px]">Very cheap bulk scanner across large web volume</span>
              </div>
              <span className="font-mono font-bold text-[#111116]">~£0.02 / scan</span>
            </div>

            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#111116] block">Tier 2: Qualification</span>
                <span className="text-[#6b6e7d] text-[11px]">Runs only on promising signals meeting commercial thresholds</span>
              </div>
              <span className="font-mono font-bold text-[#111116]">~£0.15 / lead</span>
            </div>

            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#111116] block">Tier 3: Deep Research</span>
                <span className="text-[#6b6e7d] text-[11px]">Comprehensive corporate, budget, and decision-maker profiling</span>
              </div>
              <span className="font-mono font-bold text-[#111116]">~£0.45 / opp</span>
            </div>

            <div className="p-3 bg-[#f8f8fa] rounded-xl border border-[#e5e5eb] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#111116] block">Tier 4: Prime Research</span>
                <span className="text-[#6b6e7d] text-[11px]">Top-tier prospects warranting Daniel's personal bespoke outreach</span>
              </div>
              <span className="font-mono font-bold text-emerald-700">~£1.20 / prime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
