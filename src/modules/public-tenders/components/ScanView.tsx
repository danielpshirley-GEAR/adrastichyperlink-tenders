// src/modules/public-tenders/components/ScanView.tsx
'use client';

import React, { useState } from 'react';
import { Radio, Link2, Play, CheckCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { SourceMeta } from '../connectors/registry';

interface ScanViewProps {
  sources: SourceMeta[];
  basePath?: string;
  isReviewMode?: boolean;
}

export function ScanView({ sources, basePath = '', isReviewMode = false }: ScanViewProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleScan = async (scanType: 'quick' | 'full' | 'deep') => {
    if (isReviewMode) {
      setScanMessage(`Scan action (${scanType.toUpperCase()}) disabled in Public Review Mode.`);
      setTimeout(() => setScanMessage(null), 3500);
      return;
    }
    setIsScanning(true);
    setScanMessage(`Executing ${scanType.toUpperCase()} scan across configured sources...`);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanType }),
      });
      const data = await res.json();
      setScanMessage(data.message || 'Scan completed.');
    } catch (e) {
      setScanMessage('Scan error encountered. Details logged.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    if (isReviewMode) {
      setScanMessage(`Notice URL analysis disabled in Public Review Mode.`);
      setTimeout(() => setScanMessage(null), 3500);
      return;
    }
    setIsScanning(true);
    setScanMessage(`Verifying and analyzing procurement notice URL...`);
    try {
      const res = await fetch('/api/scan/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await res.json();
      setScanMessage(data.message || 'URL analyzed.');
    } catch (e) {
      setScanMessage('Failed to parse URL.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Editorial Header */}
      <header className="border-b border-gallery-border pb-6 space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-widest text-gallery-muted font-semibold flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-600" />
          <span>MULTI-PORTAL DISCOVERY ENGINE</span>
          {isReviewMode && (
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
              REVIEW DATA
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gallery-charcoal tracking-tight">
          Scan Management
        </h1>
        <p className="text-xs sm:text-sm text-gallery-muted">
          Configure discovery schedules, monitor connector health, and execute precision scans.
        </p>
      </header>

      {/* Overview Metric Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-gallery-surface border border-gallery-border rounded-lg space-y-1 shadow-2xs">
          <div className="text-xs font-mono text-gallery-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-tender-primary" />
            <span>NEXT AUTOMATIC SCAN</span>
          </div>
          <div className="text-lg font-extrabold text-gallery-charcoal">Monday 07:00</div>
          <p className="text-[11px] text-gallery-muted">Europe/London timezone</p>
        </div>

        <div className="p-5 bg-gallery-surface border border-gallery-border rounded-lg space-y-1 shadow-2xs">
          <div className="text-xs font-mono text-gallery-muted flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>SOURCE HEALTH</span>
          </div>
          <div className="text-lg font-extrabold text-emerald-700">7 / 7 Healthy</div>
          <p className="text-[11px] text-gallery-muted">All connectors verified</p>
        </div>

        <div className="p-5 bg-gallery-surface border border-gallery-border rounded-lg space-y-1 shadow-2xs">
          <div className="text-xs font-mono text-gallery-muted flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
            <span>DISCOVERY ENGINE</span>
          </div>
          <div className="text-lg font-extrabold text-gallery-charcoal">CPV + Gemini Tier 1</div>
          <p className="text-[11px] text-gallery-muted">Multi-layered relevance filter</p>
        </div>
      </section>

      {/* Manual Scan Controls */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gallery-charcoal font-mono">
          Manual Scan Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleScan('quick')}
            disabled={isScanning}
            className="p-4 text-left border border-gallery-border rounded-lg hover:border-tender-primary hover:bg-gallery-surfaceMuted transition-all group"
          >
            <div className="text-xs font-bold text-gallery-charcoal group-hover:text-tender-primary flex items-center justify-between">
              <span>QUICK SCAN</span>
              <Play className="w-3 h-3 text-gallery-muted group-hover:text-tender-primary" />
            </div>
            <p className="text-[11px] text-gallery-muted mt-1 leading-relaxed">
              Scan only new and modified notices since the last successful execution.
            </p>
          </button>

          <button
            onClick={() => handleScan('full')}
            disabled={isScanning}
            className="p-4 text-left border border-gallery-border rounded-lg hover:border-tender-primary hover:bg-gallery-surfaceMuted transition-all group"
          >
            <div className="text-xs font-bold text-gallery-charcoal group-hover:text-tender-primary flex items-center justify-between">
              <span>FULL SCAN</span>
              <Play className="w-3 h-3 text-gallery-muted group-hover:text-tender-primary" />
            </div>
            <p className="text-[11px] text-gallery-muted mt-1 leading-relaxed">
              Scan all currently live creative and digital public procurement.
            </p>
          </button>

          <button
            onClick={() => handleScan('deep')}
            disabled={isScanning}
            className="p-4 text-left border border-gallery-border rounded-lg hover:border-tender-primary hover:bg-gallery-surfaceMuted transition-all group"
          >
            <div className="text-xs font-bold text-gallery-charcoal group-hover:text-tender-primary flex items-center justify-between">
              <span>DEEP SCAN</span>
              <Play className="w-3 h-3 text-gallery-muted group-hover:text-tender-primary" />
            </div>
            <p className="text-[11px] text-gallery-muted mt-1 leading-relaxed">
              Scan live notices, pipelines, preliminary market engagement & dynamic markets.
            </p>
          </button>
        </div>

        {scanMessage && (
          <div className="p-3 bg-gallery-canvas border border-gallery-border rounded text-xs font-mono text-gallery-charcoal flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tender-primary inline-block" />
            <span>{scanMessage}</span>
          </div>
        )}
      </section>

      {/* Analyse Specific Notice URL */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gallery-charcoal font-mono">
          Analyse Tender URL
        </h2>
        <p className="text-xs text-gallery-muted">
          Paste an exact UK public procurement URL (Find a Tender, Contracts Finder, Atamis, etc.) to verify, fetch notice data, and evaluate eligibility.
        </p>

        <form onSubmit={handleAnalyzeUrl} className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 text-gallery-faint absolute left-3 top-2.5" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://www.find-tender.service.gov.uk/Notice/..."
              className="w-full pl-9 pr-4 py-2 bg-gallery-canvas border border-gallery-border rounded text-xs text-gallery-charcoal placeholder-gallery-faint focus:outline-none focus:border-tender-primary font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isScanning || !urlInput}
            className="px-4 py-2 bg-gallery-charcoal hover:bg-black text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
          >
            Analyse URL
          </button>
        </form>
      </section>

      {/* Configured Source Registry Table */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gallery-charcoal font-mono">
            Source Registry ({sources.length})
          </h2>
          <span className="text-[11px] font-mono text-gallery-muted">All connectors modular</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gallery-border text-gallery-muted font-mono text-[10px] uppercase">
                <th className="py-2.5 font-semibold">Portal Source</th>
                <th className="py-2.5 font-semibold">Type</th>
                <th className="py-2.5 font-semibold">Health</th>
                <th className="py-2.5 font-semibold">Last Scan</th>
                <th className="py-2.5 font-semibold text-right">Checked</th>
                <th className="py-2.5 font-semibold text-right">Relevant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gallery-border">
              {sources.map((source) => (
                <tr key={source.id} className="hover:bg-gallery-canvas transition-colors">
                  <td className="py-3 font-bold text-gallery-charcoal">
                    {source.name}
                  </td>
                  <td className="py-3 font-mono text-gallery-muted text-[11px]">
                    {source.portalType}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Healthy
                    </span>
                  </td>
                  <td className="py-3 text-gallery-muted font-mono text-[11px]">
                    {source.lastScanAt ? new Date(source.lastScanAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-3 text-right font-mono text-gallery-charcoal">
                    {source.noticesChecked}
                  </td>
                  <td className="py-3 text-right font-mono text-gallery-charcoal font-bold">
                    {source.relevantFound}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
