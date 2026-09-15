// src/modules/public-tenders/components/ScanView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Radio, Link2, Play, CheckCircle2, Clock, RefreshCw, AlertCircle, Database, Sparkles, XCircle } from 'lucide-react';
import { SourceMeta } from '../connectors/registry';

interface ScanViewProps {
  sources: SourceMeta[];
  basePath?: string;
  isReviewMode?: boolean;
}

export function ScanView({ sources: initialSources, basePath = '', isReviewMode = false }: ScanViewProps) {
  const [sources, setSources] = useState<SourceMeta[]>(initialSources);
  const [selectedSource, setSelectedSource] = useState<'find_a_tender' | 'contracts_finder'>('contracts_finder');
  const [urlInput, setUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [healthData, setHealthData] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthData(data))
      .catch((err) => console.error(err));

    fetch('/api/sources')
      .then((res) => res.json())
      .then((data) => {
        if (data.sources) setSources(data.sources);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleScan = async (scanType: 'quick' | 'full' | 'deep') => {
    if (isReviewMode) {
      setScanResult({
        status: 'notice',
        message: `Scan action (${scanType.toUpperCase()}) is disabled in Public Review Mode.`,
      });
      setTimeout(() => setScanResult(null), 3500);
      return;
    }
    const sourceLabel = selectedSource === 'contracts_finder' ? 'Contracts Finder' : 'Find a Tender';
    setIsScanning(true);
    setScanResult({ status: 'running', message: `Executing ${scanType.toUpperCase()} scan against ${sourceLabel} API...` });

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanType, sourceId: selectedSource }),
      });
      const data = await res.json();
      setScanResult(data);

      // Refresh sources and health
      const [srcRes, healthRes] = await Promise.all([fetch('/api/sources'), fetch('/api/health')]);
      const srcJson = await srcRes.json();
      const healthJson = await healthRes.json();
      if (srcJson.sources) setSources(srcJson.sources);
      if (healthJson) setHealthData(healthJson);
    } catch (e: any) {
      setScanResult({ status: 'error', error: e.message || 'Scan error encountered.' });
    } finally {
      setIsScanning(false);
    }
  };

  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    if (isReviewMode) {
      setScanResult({ status: 'notice', message: 'Notice URL analysis disabled in Public Review Mode.' });
      setTimeout(() => setScanResult(null), 3500);
      return;
    }
    setIsScanning(true);
    setScanResult({ status: 'running', message: 'Verifying and analyzing procurement notice URL...' });
    try {
      const res = await fetch('/api/scan/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch (e: any) {
      setScanResult({ status: 'error', error: 'Failed to verify URL.' });
    } finally {
      setIsScanning(false);
    }
  };

  const ftsSource = sources.find((s) => s.id === 'find_a_tender' || s.id === 'find-a-tender');
  const cfSource = sources.find((s) => s.id === 'contracts_finder' || s.id === 'contracts-finder');
  const activeSourcesCount = sources.filter((s) => s.health !== 'not_implemented').length;
  const notImplementedCount = sources.filter((s) => s.health === 'not_implemented').length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Editorial Header */}
      <header className="border-b border-gallery-border pb-6 space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-widest text-gallery-muted font-semibold flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-600" />
          <span>PORTAL DISCOVERY ENGINE</span>
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
          Execute genuine Find a Tender and Contracts Finder procurement discovery, inspect connector health, and verify live notice URLs.
        </p>
      </header>

      {/* Real System Diagnostics Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Database Diagnostic */}
        <div className="p-4 bg-gallery-surface border border-gallery-border rounded-lg space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-gallery-muted flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-tender-primary" />
              <span>DATABASE</span>
            </div>
            {healthData?.database?.healthy ? (
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                CONNECTED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-200">
                {healthData?.database?.engine === 'none' ? 'OFFLINE' : 'NOT CONFIGURED'}
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-gallery-charcoal">
            {healthData?.database?.engine === 'postgres'
              ? 'Supabase / PostgreSQL'
              : healthData?.database?.engine === 'sqlite'
                ? 'Persistent SQLite'
                : 'Database Offline'}
          </div>
          <p className="text-[11px] text-gallery-muted font-mono">
            {healthData?.database?.totalTenders ?? 0} saved tenders in repository
          </p>
        </div>

        {/* Gemini AI / Deterministic Diagnostic */}
        <div className="p-4 bg-gallery-surface border border-gallery-border rounded-lg space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-gallery-muted flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>{healthData?.gemini?.configured ? 'AI CLASSIFIER' : 'DETERMINISTIC PRE-FILTER'}</span>
            </div>
            {healthData?.gemini?.configured ? (
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                CONFIGURED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                GEMINI NOT CONFIGURED
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-gallery-charcoal">
            {healthData?.gemini?.configured ? healthData.gemini.tier1Model : 'Deterministic Filter Active'}
          </div>
          <p className="text-[11px] text-gallery-muted font-mono">
            {healthData?.gemini?.configured ? 'Google GenAI SDK (JSON schema)' : 'Creative taxonomy active'}
          </p>
        </div>

        {/* Source Health Diagnostic */}
        <div className="p-4 bg-gallery-surface border border-gallery-border rounded-lg space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-gallery-muted flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>CONNECTOR HEALTH</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
              {activeSourcesCount} / {sources.length || 7} Active
            </span>
          </div>
          <div className="text-sm font-bold text-gallery-charcoal">
            {ftsSource?.health === 'healthy' && cfSource?.health === 'healthy'
              ? 'Find a Tender & Contracts Finder — Healthy'
              : (activeSourcesCount >= 2
                  ? `${ftsSource?.name || 'Find a Tender'} & ${cfSource?.name || 'Contracts Finder'} — Active`
                  : `${ftsSource?.name || 'Find a Tender'} — Healthy`)}
          </div>
          <p className="text-[11px] text-gallery-muted font-mono">
            {notImplementedCount} connectors Not Implemented
          </p>
        </div>
      </section>

      {/* Manual Scan Controls */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gallery-border pb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gallery-charcoal font-mono">
              Execute Procurement Scan
            </h2>
            <span className="text-[11px] font-mono text-gallery-muted">
              Target Source: {selectedSource === 'contracts_finder' ? 'Contracts Finder OCDS API' : 'Find a Tender (FTS) OCDS API'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-gallery-canvas border border-gallery-border rounded-lg text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedSource('contracts_finder')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedSource === 'contracts_finder'
                  ? 'bg-gallery-charcoal text-white font-bold'
                  : 'text-gallery-muted hover:text-gallery-charcoal'
              }`}
            >
              Contracts Finder
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource('find_a_tender')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedSource === 'find_a_tender'
                  ? 'bg-gallery-charcoal text-white font-bold'
                  : 'text-gallery-muted hover:text-gallery-charcoal'
              }`}
            >
              Find a Tender
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleScan('quick')}
            disabled={isScanning}
            className="p-4 text-left border border-gallery-border rounded-lg hover:border-tender-primary hover:bg-gallery-surfaceMuted transition-all group disabled:opacity-50"
          >
            <div className="text-xs font-bold text-gallery-charcoal group-hover:text-tender-primary flex items-center justify-between">
              <span>QUICK SCAN</span>
              <Play className="w-3 h-3 text-gallery-muted group-hover:text-tender-primary" />
            </div>
            <p className="text-[11px] text-gallery-muted mt-1 leading-relaxed">
              Scan notices modified since last successful scan date.
            </p>
          </button>

          <button
            onClick={() => handleScan('full')}
            disabled={isScanning}
            className="p-4 text-left border border-gallery-border rounded-lg hover:border-tender-primary hover:bg-gallery-surfaceMuted transition-all group disabled:opacity-50"
          >
            <div className="text-xs font-bold text-gallery-charcoal group-hover:text-tender-primary flex items-center justify-between">
              <span>FULL SCAN</span>
              <Play className="w-3 h-3 text-gallery-muted group-hover:text-tender-primary" />
            </div>
            <p className="text-[11px] text-gallery-muted mt-1 leading-relaxed">
              Scan up to 100 currently live creative opportunities from Find a Tender.
            </p>
          </button>

          <button
            onClick={() => handleScan('deep')}
            disabled={isScanning}
            className="p-4 text-left border border-gallery-border rounded-lg hover:border-tender-primary hover:bg-gallery-surfaceMuted transition-all group disabled:opacity-50"
          >
            <div className="text-xs font-bold text-gallery-charcoal group-hover:text-tender-primary flex items-center justify-between">
              <span>DEEP SCAN</span>
              <Play className="w-3 h-3 text-gallery-muted group-hover:text-tender-primary" />
            </div>
            <p className="text-[11px] text-gallery-muted mt-1 leading-relaxed">
              Scan live notices plus early pipeline and future market engagement notices.
            </p>
          </button>
        </div>

        {/* Live Scan Status / Result Box */}
        {scanResult && (
          <div className="p-4 bg-gallery-canvas border border-gallery-border rounded-lg space-y-2 font-mono text-xs">
            {scanResult.status === 'running' ? (
              <div className="flex items-center gap-2 text-tender-primary">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{scanResult.message}</span>
              </div>
            ) : scanResult.status === 'error' ? (
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Scan Failure: {scanResult.error || scanResult.message}</span>
              </div>
            ) : (
              <div className="space-y-1.5 text-gallery-charcoal">
                <div className="flex items-center justify-between border-b border-gallery-border pb-1.5">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Scan Completed Successfully ({scanResult.scanType?.toUpperCase()})</span>
                  </span>
                  <span className="text-gallery-muted text-[11px]">{scanResult.durationMs}ms</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div>
                    <span className="text-gallery-muted">Notices Checked:</span>{' '}
                    <strong>{scanResult.noticesChecked ?? 0}</strong>
                  </div>
                  <div>
                    <span className="text-gallery-muted">Initial Candidates:</span>{' '}
                    <strong>{scanResult.initialCandidates ?? 0}</strong>
                  </div>
                  <div>
                    <span className="text-gallery-muted">Duplicates:</span>{' '}
                    <strong>{scanResult.duplicatesCount ?? 0}</strong>
                  </div>
                  <div>
                    <span className="text-gallery-muted">Relevant Saved:</span>{' '}
                    <strong className="text-emerald-700">{scanResult.relevantFound ?? 0}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Analyse Specific Notice URL */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gallery-charcoal font-mono">
          Live Notice URL Verification
        </h2>
        <p className="text-xs text-gallery-muted">
          Test any Find a Tender or UK public procurement URL. Performs genuine HTTP verification, redirect resolution, and content matching.
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
            Verify URL
          </button>
        </form>
      </section>

      {/* Configured Source Registry Table */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gallery-charcoal font-mono">
            Procurement Sources ({sources.length})
          </h2>
          <span className="text-[11px] font-mono text-gallery-muted">
            Find a Tender implemented in Phase 2
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gallery-border text-gallery-muted font-mono text-[10px] uppercase">
                <th className="py-2.5 font-semibold">Portal Source</th>
                <th className="py-2.5 font-semibold">Type</th>
                <th className="py-2.5 font-semibold">Health Status</th>
                <th className="py-2.5 font-semibold">Last Verified Scan</th>
                <th className="py-2.5 font-semibold text-right">Notices Scanned</th>
                <th className="py-2.5 font-semibold text-right">Relevant Saved</th>
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
                    {source.health === 'healthy' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        HEALTHY
                      </span>
                    ) : source.health === 'degraded' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        DEGRADED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gallery-surfaceMuted text-gallery-muted text-[10px] font-semibold border border-gallery-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-gallery-border" />
                        NOT IMPLEMENTED
                      </span>
                    )}
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
