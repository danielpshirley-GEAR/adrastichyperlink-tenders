// src/modules/public-tenders/components/FirstRunEmptyState.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, ArrowRight, Loader2, Database } from 'lucide-react';

interface FirstRunEmptyStateProps {
  onScanTriggered?: () => void;
}

export function FirstRunEmptyState({ onScanTriggered }: FirstRunEmptyStateProps) {
  const [isScanning, setIsScanning] = useState(false);

  const handleRunFirstScan = async () => {
    setIsScanning(true);
    try {
      await fetch('/api/scan', { method: 'POST' });
      if (onScanTriggered) onScanTriggered();
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-12 p-8 sm:p-12 bg-gallery-surface border border-gallery-border rounded-xl shadow-xs">
      <div className="space-y-8">
        {/* Header Block */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-tender-primaryLight border border-tender-primaryBorder text-xs font-mono font-medium text-tender-primary">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PRIMARY UK PUBLIC SECTOR DISCOVERY</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gallery-charcoal tracking-tight">
            PUBLIC TENDER ENGINE
          </h1>

          <p className="text-base sm:text-lg text-gallery-muted leading-relaxed max-w-2xl">
            Find relevant UK public-sector creative contracts.
          </p>
        </div>

        {/* Operational Status Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-gallery-canvas border border-gallery-border rounded-lg">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-gallery-muted font-semibold">
              Connector Status
            </div>
            <div className="text-sm font-bold text-gallery-charcoal flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              7 procurement sources configured
            </div>
            <p className="text-xs text-gallery-muted pt-1">
              Find a Tender, Contracts Finder, PCS, Sell2Wales, NHS Atamis, eTendersNI, MOD DSP
            </p>
          </div>

          <div className="space-y-1 sm:border-l sm:border-gallery-border sm:pl-6">
            <div className="text-xs font-mono uppercase tracking-wider text-gallery-muted font-semibold">
              Scan Schedule
            </div>
            <div className="text-sm font-bold text-gallery-charcoal">
              Next automatic scan: Monday 07:00
            </div>
            <p className="text-xs text-gallery-muted pt-1">
              Automated scans: Monday, Wednesday, Friday at 07:00 Europe/London
            </p>
          </div>
        </div>

        {/* State Notice & Action */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gallery-border">
          <div className="flex items-center gap-2 text-sm text-gallery-muted">
            <Database className="w-4 h-4 text-gallery-faint" />
            <span>No tenders scanned yet.</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/scan"
              className="px-4 py-2 text-xs font-semibold text-gallery-charcoal hover:bg-gallery-surfaceMuted border border-gallery-border rounded-md transition-colors"
            >
              Configure Scanners
            </Link>

            <button
              onClick={handleRunFirstScan}
              disabled={isScanning}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-tender-primary hover:bg-tender-primaryHover text-white text-xs font-bold tracking-wide rounded-md transition-colors shadow-xs disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning Sources...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>RUN FIRST SCAN</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
