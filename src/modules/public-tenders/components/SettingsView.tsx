// src/modules/public-tenders/components/SettingsView.tsx
'use client';

import React from 'react';
import { Sliders, Shield, Key, Clock, Database } from 'lucide-react';

interface SettingsViewProps {
  basePath?: string;
  isReviewMode?: boolean;
}

export function SettingsView({ basePath = '', isReviewMode = false }: SettingsViewProps) {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <header className="border-b border-gallery-border pb-6 space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-widest text-gallery-muted font-semibold flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-tender-primary" />
          <span>WORKSTATION CONFIGURATION</span>
          {isReviewMode && (
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
              REVIEW DATA
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gallery-charcoal tracking-tight">
          System Settings
        </h1>
        <p className="text-xs sm:text-sm text-gallery-muted">
          Manage procurement discovery filters, scheduled scans, and AI cost-control thresholds.
        </p>
      </header>

      {/* Discovery Schedules */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-tender-primary" />
          <h2 className="text-sm font-bold text-gallery-charcoal uppercase tracking-wider font-mono">
            Automated Scan Schedule (Section 14)
          </h2>
        </div>
        <p className="text-xs text-gallery-muted leading-relaxed">
          Full discovery runs operate on Monday, Wednesday, and Friday at 07:00 Europe/London. Daily lightweight rechecks inspect active applications and deadlines.
        </p>
        <div className="p-3 bg-gallery-canvas border border-gallery-border rounded font-mono text-xs text-gallery-charcoal flex items-center justify-between">
          <span>0 7 * * 1,3,5 (Europe/London)</span>
          <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            Active
          </span>
        </div>
      </section>

      {/* Gemini AI Configuration */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-tender-primary" />
          <h2 className="text-sm font-bold text-gallery-charcoal uppercase tracking-wider font-mono">
            Gemini Integration & Cost Control (Section 20 & 22)
          </h2>
        </div>
        <p className="text-xs text-gallery-muted leading-relaxed">
          Gemini runs strictly server-side using <code>GEMINI_API_KEY</code>. AI execution follows strict cost tiers (Tier 0: deterministic, Tier 1: cheap classification, Tier 2: tender analysis, Tier 3: eligibility check, Tier 4: bid writing on Daniel BID only).
        </p>
        <div className="p-3 bg-gallery-canvas border border-gallery-border rounded flex items-center justify-between text-xs">
          <span className="font-mono text-gallery-charcoal">GEMINI_API_KEY: Server-Side Configured</span>
          <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono text-[11px]">
            <Shield className="w-3.5 h-3.5" />
            <span>Zero Public Exposure</span>
          </span>
        </div>
      </section>

      {/* Database Status */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-tender-primary" />
          <h2 className="text-sm font-bold text-gallery-charcoal uppercase tracking-wider font-mono">
            Database Architecture (Section 49)
          </h2>
        </div>
        <p className="text-xs text-gallery-muted leading-relaxed">
          Normalized 25-table relational schema for PostgreSQL / Supabase with strict audit logging, prompt history, and vector embeddings.
        </p>
        <div className="p-3 bg-gallery-canvas border border-gallery-border rounded font-mono text-xs text-gallery-charcoal">
          Schema: <code>src/shared/database/schema.sql</code> (25 tables)
        </div>
      </section>
    </div>
  );
}
