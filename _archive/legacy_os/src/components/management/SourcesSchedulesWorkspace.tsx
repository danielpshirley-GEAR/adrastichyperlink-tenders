"use client";

import React from "react";
import { Radio, Clock, CheckCircle2, RefreshCw, Layers, ShieldCheck } from "lucide-react";

export function SourcesSchedulesWorkspace() {
  const sources = [
    { name: "LinkedIn Explicit Buyer Intent", type: "Active Demand", frequency: "Hourly", lastScan: "12m ago", status: "Active", resultsToday: 3 },
    { name: "TechCrunch & Crunchbase Funding Feeds", type: "Business Signals", frequency: "Morning & Midday", lastScan: "2h ago", status: "Active", resultsToday: 14 },
    { name: "Contracts Finder & Find a Tender", type: "Public Tenders", frequency: "Morning & Midday", lastScan: "3h ago", status: "Active", resultsToday: 4 },
    { name: "Creative & Motion Job Signal Scraper", type: "In-House Capacity", frequency: "Morning", lastScan: "5h ago", status: "Active", resultsToday: 8 },
    { name: "Campaign Live & Agency Roster News", type: "Agency Overflow", frequency: "Morning & Afternoon", lastScan: "1h ago", status: "Active", resultsToday: 6 },
    { name: "Studio Website (adrastichyperlink.co.uk)", type: "Inbound Engine", frequency: "Continuous Webhook", lastScan: "Live", status: "Connected", resultsToday: 2 },
  ];

  const scheduleCadence = [
    {
      cadence: "HOURLY SCAN",
      focus: "Active buyer intent, high-priority creative requests, urgent LinkedIn posts.",
      timing: "Every 60 minutes",
    },
    {
      cadence: "MORNING CYCLE (08:30)",
      focus: "Business growth signals, agency account wins, internal transformation news, new tenders.",
      timing: "Daily 08:30 GMT",
    },
    {
      cadence: "MIDDAY REFRESH (13:00)",
      focus: "High-intent signal updates, private RFPs, tender amendments.",
      timing: "Daily 13:00 GMT",
    },
    {
      cadence: "AFTERNOON TOUCH (16:30)",
      focus: "Active buyer refresh, follow-up cadence triggers, agency recruiter posts.",
      timing: "Daily 16:30 GMT",
    },
    {
      cadence: "NIGHT ENRICHMENT (22:00)",
      focus: "Deep research queue, signal stacking, deduplication, lead score recalculations.",
      timing: "Daily 22:00 GMT",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-studio-border pb-5">
        <div>
          <div className="text-[10px] font-mono text-studio-muted uppercase tracking-widest font-bold flex items-center gap-1.5 mb-1">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            SHARED BRAIN • SOURCES CONTROL CENTRE & AUTOMATED SCHEDULES (SECTIONS 33 & 34)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight studio-title">
            Search Sources & Schedules
          </h1>
          <p className="text-sm text-studio-muted mt-0.5">
            Automated customer acquisition pipelines operating in the background. The system scans continuously so Daniel focuses on high-value conversations.
          </p>
        </div>

        <button className="px-4 py-2 bg-studio-surface hover:bg-studio-elevated border border-studio-border text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Run Immediate Full Scan</span>
        </button>
      </div>

      {/* Operational Sources Grid */}
      <div className="bg-studio-card border border-studio-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            Active Discovery Engines
          </h3>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">
            6/6 ENGINES OPERATIONAL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sources.map((s, idx) => (
            <div
              key={idx}
              className="p-4 bg-studio-surface border border-studio-border rounded-xl space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-white leading-snug">{s.name}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase shrink-0">
                  {s.status}
                </span>
              </div>

              <div className="text-[11px] text-studio-muted">
                Engine: <strong className="text-studio-text">{s.type}</strong>
              </div>

              <div className="pt-2 border-t border-studio-border/60 flex items-center justify-between text-[10px] font-mono text-studio-muted">
                <span>Frequency: {s.frequency}</span>
                <span>Scanned: {s.lastScan}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Automated Schedule (Section 34) */}
      <div className="bg-studio-card border border-studio-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-studio-muted" />
          <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            Daily Automated Scanning Architecture (Section 34)
          </h3>
        </div>

        <div className="space-y-2.5">
          {scheduleCadence.map((cad, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-studio-surface border border-studio-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-mono font-bold text-white text-[11px]">
                  {cad.cadence}
                </div>
                <p className="text-studio-muted text-[11px]">{cad.focus}</p>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-studio-elevated text-studio-text shrink-0">
                {cad.timing}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
