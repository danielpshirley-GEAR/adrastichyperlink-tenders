// src/modules/public-tenders/components/TendersWorkstationView.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  X,
  ExternalLink,
  ChevronDown,
  Building2,
  Calendar,
  Clock,
  Briefcase,
  Layers,
  FileCheck,
  ShieldCheck,
  Tag,
  Radio,
  Sparkles,
  Inbox,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { TenderSummary } from '../types/tender';
import { CPV_CATEGORIES, CpvCategory } from '../config/relevance-taxonomy';
import { SourcesCoverageView } from './SourcesCoverageView';
import { ApplicationsView } from './ApplicationsView';
import { TenderApplication } from '../types/application';

export type WorkstationTab = 'OPPORTUNITIES' | 'MY BIDS' | 'SOURCES & COVERAGE';

interface TendersWorkstationViewProps {
  initialTenders: TenderSummary[];
  initialApplications?: TenderApplication[];
  basePath?: string;
  isReviewMode?: boolean;
}

const CPV_CATEGORY_CODE_MAP: Record<CpvCategory, string[]> = {
  ADVERTISING_MARKETING: ['79340000', '79341000', '79342000'],
  DESIGN_BRANDING: ['79822500', '79415200', '79930000'],
  VIDEO_MOTION: ['92100000', '92110000', '92111000', '92111200'],
  DIGITAL_WEB: ['72413000'],
  PR_COMMUNICATIONS: ['79416000', '79416100', '79416200'],
  CONTENT_WRITING: ['92312211'],
  EVENTS_PHOTOGRAPHY: ['79952000', '79960000', '79961000'],
  SECONDARY_CREATIVE: ['79800000', '92500000', '80000000'],
};

export function TendersWorkstationView({
  initialTenders,
  initialApplications = [],
  basePath = '',
  isReviewMode = false,
}: TendersWorkstationViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state synchronization
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<WorkstationTab>(
    tabParam === 'bids' ? 'MY BIDS' : tabParam === 'sources' ? 'SOURCES & COVERAGE' : 'OPPORTUNITIES'
  );

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [stageFilter, setStageFilter] = useState<'all' | 'tender' | 'planning'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'find_a_tender' | 'contracts_finder'>('all');
  const [qualificationFilter, setQualificationFilter] = useState<'all' | 'STRONG' | 'POSSIBLE' | 'WEAK'>('all');
  const [selectedCpvCategories, setSelectedCpvCategories] = useState<CpvCategory[]>([]);
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');
  const [includeUnknownValue, setIncludeUnknownValue] = useState(true);
  const [smeSuitable, setSmeSuitable] = useState(false);
  const [vcseSuitable, setVcseSuitable] = useState(false);
  const [buyerFilter, setBuyerFilter] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sortBy, setSortBy] = useState<'deadline' | 'newest' | 'adrastic_fit' | 'value_high' | 'value_low'>('deadline');

  // Data states
  const [tenders, setTenders] = useState<TenderSummary[]>(initialTenders);
  const [applications, setApplications] = useState<TenderApplication[]>(initialApplications);
  const [loading, setLoading] = useState(false);

  // Load applications if not provided
  useEffect(() => {
    if (initialApplications.length > 0 || isReviewMode) return;
    fetch('/api/applications')
      .then((res) => (res.ok ? res.json() : { applications: [] }))
      .then((data) => {
        if (data.applications) setApplications(data.applications);
      })
      .catch((err) => console.error(err));
  }, [initialApplications, isReviewMode]);

  // Query API when filters change in live mode
  useEffect(() => {
    if (isReviewMode) {
      setTenders(initialTenders);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (stageFilter !== 'all') params.set('stage', stageFilter);
        if (sourceFilter !== 'all') params.set('source', sourceFilter);
        if (qualificationFilter !== 'all') params.set('qualification', qualificationFilter);
        if (selectedCpvCategories.length > 0) {
          const codes = selectedCpvCategories.flatMap((cat) => CPV_CATEGORY_CODE_MAP[cat]);
          params.set('cpv', codes.join(','));
        }
        if (minValue) params.set('minValue', minValue);
        if (maxValue) params.set('maxValue', maxValue);
        if (!includeUnknownValue) params.set('includeUnknownValue', 'false');
        if (smeSuitable) params.set('sme', 'true');
        if (vcseSuitable) params.set('vcse', 'true');
        if (buyerFilter.trim()) params.set('buyer', buyerFilter.trim());
        if (includeArchived) params.set('includeArchived', 'true');
        params.set('sort', sortBy);

        const res = await fetch(`/api/tenders?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTenders(data.tenders || []);
        }
      } catch (err) {
        console.error('Failed to load tenders:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [
    searchQuery,
    stageFilter,
    sourceFilter,
    qualificationFilter,
    selectedCpvCategories,
    minValue,
    maxValue,
    includeUnknownValue,
    smeSuitable,
    vcseSuitable,
    buyerFilter,
    includeArchived,
    sortBy,
    isReviewMode,
    initialTenders,
  ]);

  // Review mode client-side filtering
  const displayTenders = useMemo(() => {
    if (!isReviewMode) return tenders;

    return initialTenders.filter((t) => {
      const isArchived =
        t.isArchived ||
        t.lifecycleStatus === 'EXPIRED' ||
        t.lifecycleStatus === 'REJECTED' ||
        t.qualification === 'REJECT';
      if (!includeArchived && isArchived) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const corpus = `${t.title} ${t.buyerName} ${t.description} ${t.canonicalReference}`.toLowerCase();
        if (!corpus.includes(q)) return false;
      }

      if (qualificationFilter !== 'all' && t.qualification !== qualificationFilter) return false;

      if (stageFilter === 'tender') {
        const s = (t.procurementStage || '').toLowerCase();
        if (!s.includes('tender') && !s.includes('open')) return false;
      } else if (stageFilter === 'planning') {
        const s = (t.procurementStage || '').toLowerCase();
        if (!s.includes('planning') && !s.includes('engagement') && !s.includes('preliminary')) return false;
      }

      if (sourceFilter === 'find_a_tender') {
        const sId = (t.sourceId || t.source || '').toLowerCase();
        if (!sId.includes('find_a_tender') && !sId.includes('fts')) return false;
      } else if (sourceFilter === 'contracts_finder') {
        const sId = (t.sourceId || t.source || '').toLowerCase();
        if (!sId.includes('contracts_finder')) return false;
      }

      if (smeSuitable && !t.smeSuitable) return false;
      if (vcseSuitable && !t.vcseSuitable) return false;

      if (buyerFilter.trim()) {
        if (!(t.buyerName || '').toLowerCase().includes(buyerFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [
    isReviewMode,
    tenders,
    initialTenders,
    searchQuery,
    stageFilter,
    sourceFilter,
    qualificationFilter,
    smeSuitable,
    vcseSuitable,
    buyerFilter,
    includeArchived,
  ]);

  const handleCpvCategoryToggle = (cat: CpvCategory) => {
    setSelectedCpvCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setStageFilter('all');
    setSourceFilter('all');
    setQualificationFilter('all');
    setSelectedCpvCategories([]);
    setMinValue('');
    setMaxValue('');
    setIncludeUnknownValue(true);
    setSmeSuitable(false);
    setVcseSuitable(false);
    setBuyerFilter('');
    setIncludeArchived(false);
    setSortBy('deadline');
  };

  // Active filter tags for chip display
  const activeChips = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = [];
    if (searchQuery.trim()) {
      chips.push({ label: `"${searchQuery.trim()}"`, onRemove: () => setSearchQuery('') });
    }
    if (stageFilter !== 'all') {
      chips.push({
        label: stageFilter === 'tender' ? 'Stage: Tender' : 'Stage: Planning PIN',
        onRemove: () => setStageFilter('all'),
      });
    }
    if (sourceFilter !== 'all') {
      chips.push({
        label: sourceFilter === 'find_a_tender' ? 'Source: Find a Tender' : 'Source: Contracts Finder',
        onRemove: () => setSourceFilter('all'),
      });
    }
    if (qualificationFilter !== 'all') {
      chips.push({
        label: `Fit: ${qualificationFilter}`,
        onRemove: () => setQualificationFilter('all'),
      });
    }
    selectedCpvCategories.forEach((cat) => {
      const label = CPV_CATEGORIES.find((c) => c.id === cat)?.label || cat;
      chips.push({
        label: `CPV: ${label}`,
        onRemove: () => handleCpvCategoryToggle(cat),
      });
    });
    if (smeSuitable) {
      chips.push({ label: 'SME Suitable', onRemove: () => setSmeSuitable(false) });
    }
    if (vcseSuitable) {
      chips.push({ label: 'VCSE Suitable', onRemove: () => setVcseSuitable(false) });
    }
    if (buyerFilter.trim()) {
      chips.push({ label: `Buyer: ${buyerFilter.trim()}`, onRemove: () => setBuyerFilter('') });
    }
    if (minValue || maxValue) {
      chips.push({
        label: `£${minValue || '0'} - £${maxValue || 'Any'}`,
        onRemove: () => {
          setMinValue('');
          setMaxValue('');
        },
      });
    }
    if (includeArchived) {
      chips.push({ label: 'Including Expired', onRemove: () => setIncludeArchived(false) });
    }
    return chips;
  }, [
    searchQuery,
    stageFilter,
    sourceFilter,
    qualificationFilter,
    selectedCpvCategories,
    smeSuitable,
    vcseSuitable,
    buyerFilter,
    minValue,
    maxValue,
    includeArchived,
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Editorial Title & Secondary Tabs Header */}
      <div className="border-b border-gallery-border pb-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-gallery-muted font-semibold flex items-center gap-2">
              <span>PERSONALISED FIND A TENDER WORKSTATION</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                100% RECALL ACTIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gallery-charcoal tracking-tight mt-1">
              Public Tender Workstation
            </h1>
            <p className="text-xs sm:text-sm text-gallery-muted mt-1 max-w-2xl">
              Search, filter, and inspect verified UK public procurement opportunities tailored for Adrastichyperlink.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('SOURCES & COVERAGE')}
              className="px-3.5 py-1.5 rounded bg-gallery-surface border border-gallery-border text-gallery-charcoal hover:bg-gallery-surfaceMuted text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Coverage &amp; Portals</span>
            </button>
          </div>
        </div>

        {/* Secondary Tabs */}
        <div className="flex items-center gap-1 border-b border-gallery-border overflow-x-auto pb-px pt-2">
          <button
            onClick={() => setActiveTab('OPPORTUNITIES')}
            className={`px-4 py-2 text-xs font-bold tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'OPPORTUNITIES'
                ? 'border-tender-primary text-tender-primary'
                : 'border-transparent text-gallery-muted hover:text-gallery-charcoal'
            }`}
          >
            <span>OPPORTUNITIES</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                activeTab === 'OPPORTUNITIES'
                  ? 'bg-tender-primary/10 text-tender-primary font-bold'
                  : 'bg-gallery-border text-gallery-muted'
              }`}
            >
              {displayTenders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('MY BIDS')}
            className={`px-4 py-2 text-xs font-bold tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'MY BIDS'
                ? 'border-tender-primary text-tender-primary'
                : 'border-transparent text-gallery-muted hover:text-gallery-charcoal'
            }`}
          >
            <span>MY BIDS</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                activeTab === 'MY BIDS'
                  ? 'bg-tender-primary/10 text-tender-primary font-bold'
                  : 'bg-gallery-border text-gallery-muted'
              }`}
            >
              {applications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SOURCES & COVERAGE')}
            className={`px-4 py-2 text-xs font-bold tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'SOURCES & COVERAGE'
                ? 'border-tender-primary text-tender-primary'
                : 'border-transparent text-gallery-muted hover:text-gallery-charcoal'
            }`}
          >
            <span>SOURCES &amp; COVERAGE</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              2 Connected
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: OPPORTUNITIES WORKSTATION */}
      {activeTab === 'OPPORTUNITIES' && (
        <div className="space-y-6">
          {/* Prominent Find a Tender Keyword Search Bar */}
          <div className="bg-gallery-surface border border-gallery-border rounded-xl p-4 shadow-2xs">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-gallery-muted absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search opportunities by keyword (e.g. "motion design", animation, brand identity, explainer)...'
                className="w-full pl-12 pr-24 py-3 bg-gallery-canvas border border-gallery-border rounded-lg text-sm text-gallery-charcoal placeholder-gallery-muted/70 focus:outline-none focus:ring-2 focus:ring-tender-primary/20 focus:border-tender-primary font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-12 text-gallery-muted hover:text-gallery-charcoal p-1"
                  aria-label="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2.5 text-[11px] text-gallery-muted">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Suggested Keywords:</span>
              {['motion design', 'animation', 'brand strategy', 'explainer video', 'creative agency', 'graphic design'].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => setSearchQuery(term)}
                    className="px-2 py-0.5 rounded bg-gallery-surfaceMuted hover:bg-gallery-border text-gallery-charcoal border border-gallery-border/80 transition-colors"
                  >
                    +{term}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Two-Column Search & Filter Workstation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Filter Column (28%) */}
            <aside className="lg:col-span-4 xl:col-span-3 bg-gallery-surface border border-gallery-border rounded-xl p-5 space-y-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gallery-border pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gallery-muted" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gallery-charcoal">
                    Filters
                  </span>
                </div>
                {activeChips.length > 0 && (
                  <button
                    onClick={handleClearAllFilters}
                    className="text-[11px] font-semibold text-tender-primary hover:underline inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* 1. Procurement Stage */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gallery-charcoal uppercase tracking-wider">
                  Procurement Stage
                </label>
                <div className="space-y-1.5 text-xs">
                  {[
                    { id: 'all', label: 'All Stages' },
                    { id: 'tender', label: 'Tender / Contract Notice (Live Bids)' },
                    { id: 'planning', label: 'Planning / Early Engagement PIN' },
                  ].map((st) => (
                    <label key={st.id} className="flex items-center gap-2 cursor-pointer text-gallery-charcoal hover:text-black">
                      <input
                        type="radio"
                        name="stage"
                        checked={stageFilter === st.id}
                        onChange={() => setStageFilter(st.id as any)}
                        className="rounded-full text-tender-primary focus:ring-tender-primary"
                      />
                      <span>{st.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. Adrastichyperlink Fit */}
              <div className="space-y-2 border-t border-gallery-border/60 pt-4">
                <label className="text-xs font-bold text-gallery-charcoal uppercase tracking-wider">
                  Adrastichyperlink Fit
                </label>
                <div className="space-y-1.5 text-xs">
                  {[
                    { id: 'all', label: 'All Qualified Opportunities' },
                    { id: 'STRONG', label: 'Strong Creative Alignment' },
                    { id: 'POSSIBLE', label: 'Possible Alignment' },
                    { id: 'WEAK', label: 'Weak Alignment' },
                  ].map((q) => (
                    <label key={q.id} className="flex items-center gap-2 cursor-pointer text-gallery-charcoal hover:text-black">
                      <input
                        type="radio"
                        name="qualification"
                        checked={qualificationFilter === q.id}
                        onChange={() => setQualificationFilter(q.id as any)}
                        className="rounded-full text-tender-primary focus:ring-tender-primary"
                      />
                      <span>{q.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Source Portal */}
              <div className="space-y-2 border-t border-gallery-border/60 pt-4">
                <label className="text-xs font-bold text-gallery-charcoal uppercase tracking-wider">
                  Procurement Portal
                </label>
                <div className="space-y-1.5 text-xs">
                  {[
                    { id: 'all', label: 'All Sources (FTS + CF)' },
                    { id: 'find_a_tender', label: 'Find a Tender (High-value notices)' },
                    { id: 'contracts_finder', label: 'Contracts Finder (Central / SME)' },
                  ].map((src) => (
                    <label key={src.id} className="flex items-center gap-2 cursor-pointer text-gallery-charcoal hover:text-black">
                      <input
                        type="radio"
                        name="source"
                        checked={sourceFilter === src.id}
                        onChange={() => setSourceFilter(src.id as any)}
                        className="rounded-full text-tender-primary focus:ring-tender-primary"
                      />
                      <span>{src.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. CPV Creative Taxonomy Groups */}
              <div className="space-y-2 border-t border-gallery-border/60 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gallery-charcoal uppercase tracking-wider">
                    Creative Capability (CPV)
                  </label>
                  {selectedCpvCategories.length > 0 && (
                    <button
                      onClick={() => setSelectedCpvCategories([])}
                      className="text-[10px] text-gallery-muted hover:text-gallery-charcoal"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                  {CPV_CATEGORIES.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-gallery-charcoal hover:text-black">
                      <input
                        type="checkbox"
                        checked={selectedCpvCategories.includes(cat.id)}
                        onChange={() => handleCpvCategoryToggle(cat.id)}
                        className="rounded text-tender-primary focus:ring-tender-primary"
                      />
                      <span className="truncate">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 5. Contract Value */}
              <div className="space-y-2 border-t border-gallery-border/60 pt-4">
                <label className="text-xs font-bold text-gallery-charcoal uppercase tracking-wider">
                  Contract Value (£)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="number"
                    placeholder="Min £"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    className="p-2 bg-gallery-canvas border border-gallery-border rounded text-gallery-charcoal font-mono"
                  />
                  <input
                    type="number"
                    placeholder="Max £"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    className="p-2 bg-gallery-canvas border border-gallery-border rounded text-gallery-charcoal font-mono"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer text-gallery-muted pt-1">
                  <input
                    type="checkbox"
                    checked={includeUnknownValue}
                    onChange={(e) => setIncludeUnknownValue(e.target.checked)}
                    className="rounded text-tender-primary focus:ring-tender-primary"
                  />
                  <span>Include unspecified value</span>
                </label>
              </div>

              {/* 6. Suitability */}
              <div className="space-y-2 border-t border-gallery-border/60 pt-4">
                <label className="text-xs font-bold text-gallery-charcoal uppercase tracking-wider">
                  Suitability
                </label>
                <div className="space-y-1.5 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-gallery-charcoal">
                    <input
                      type="checkbox"
                      checked={smeSuitable}
                      onChange={(e) => setSmeSuitable(e.target.checked)}
                      className="rounded text-tender-primary focus:ring-tender-primary"
                    />
                    <span>Suitable for SMEs</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gallery-charcoal">
                    <input
                      type="checkbox"
                      checked={vcseSuitable}
                      onChange={(e) => setVcseSuitable(e.target.checked)}
                      className="rounded text-tender-primary focus:ring-tender-primary"
                    />
                    <span>Suitable for VCSEs</span>
                  </label>
                </div>
              </div>

              {/* 7. Buyer Authority */}
              <div className="space-y-2 border-t border-gallery-border/60 pt-4">
                <label className="text-xs font-bold text-gallery-charcoal uppercase tracking-wider">
                  Buyer Authority
                </label>
                <input
                  type="text"
                  placeholder="e.g. Department for Education"
                  value={buyerFilter}
                  onChange={(e) => setBuyerFilter(e.target.value)}
                  className="w-full p-2 bg-gallery-canvas border border-gallery-border rounded text-xs text-gallery-charcoal placeholder-gallery-muted/70"
                />
              </div>

              {/* 8. Archived / Expired */}
              <div className="border-t border-gallery-border/60 pt-4">
                <label className="flex items-center gap-2 text-xs cursor-pointer text-gallery-muted">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                    className="rounded text-tender-primary focus:ring-tender-primary"
                  />
                  <span>Show expired / archived tenders</span>
                </label>
              </div>
            </aside>

            {/* Right Results Column (72%) */}
            <main className="lg:col-span-8 xl:col-span-9 space-y-4">
              {/* Results Meta & Sort Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gallery-surface border border-gallery-border rounded-xl p-4 shadow-2xs">
                <div>
                  <div className="text-sm font-extrabold text-gallery-charcoal">
                    We&apos;ve found <span className="text-tender-primary font-mono">{displayTenders.length}</span> opportunities
                  </div>
                  <div className="text-[11px] text-gallery-muted mt-0.5">
                    Updated continuously from official UK public sources.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gallery-muted font-semibold">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs font-semibold px-3 py-1.5 rounded border border-gallery-border bg-gallery-canvas text-gallery-charcoal focus:outline-none focus:ring-1 focus:ring-tender-primary"
                  >
                    <option value="deadline">Deadline: Soonest first</option>
                    <option value="newest">Published: Newest first</option>
                    <option value="adrastic_fit">Adrastichyperlink Fit</option>
                    <option value="value_high">Value: Highest first</option>
                    <option value="value_low">Value: Lowest first</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Chips */}
              {activeChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-gallery-surfaceMuted/50 border border-gallery-border/80 rounded-lg">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gallery-muted">
                    Active Filters:
                  </span>
                  {activeChips.map((chip, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gallery-surface border border-gallery-border text-xs text-gallery-charcoal shadow-2xs"
                    >
                      <span>{chip.label}</span>
                      <button
                        onClick={chip.onRemove}
                        className="text-gallery-muted hover:text-gallery-charcoal ml-0.5 p-0.5"
                        aria-label={`Remove filter ${chip.label}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={handleClearAllFilters}
                    className="text-xs font-semibold text-tender-primary hover:underline ml-auto"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Opportunities List */}
              {loading ? (
                <div className="py-20 text-center text-xs font-mono text-gallery-muted bg-gallery-surface border border-gallery-border rounded-xl">
                  Applying workstation filters...
                </div>
              ) : displayTenders.length === 0 ? (
                <div className="py-16 text-center bg-gallery-surface border border-gallery-border rounded-xl space-y-3 p-8 shadow-2xs">
                  <Inbox className="w-10 h-10 text-gallery-faint mx-auto" />
                  <div className="text-base font-bold text-gallery-charcoal">No Matching Opportunities</div>
                  <p className="text-xs text-gallery-muted max-w-md mx-auto leading-relaxed">
                    No notices match your current combination of keyword, stage, and commercial criteria.
                    Try clearing specific filters or broadening your keyword query.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={handleClearAllFilters}
                      className="px-4 py-2 bg-tender-primary hover:bg-tender-primaryHover text-white text-xs font-bold rounded-md transition-colors shadow-2xs"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayTenders.map((tender) => {
                    const tenderRef = tender.canonicalReference || tender.id;
                    const detailHref = `${basePath}/tenders/${tenderRef}`;
                    const isCF =
                      tender.sourceId === 'contracts_finder' ||
                      tender.source === 'contracts_finder' ||
                      tender.officialNoticeUrl?.includes('contractsfinder.service.gov.uk');
                    const sourceLabel = isCF ? 'Contracts Finder' : 'Find a Tender';

                    const rawSummary = tender.plainEnglishSummary || tender.description || '';
                    const cleanSummary =
                      rawSummary.startsWith('{') && rawSummary.includes('"error"')
                        ? 'Official public notice published by buyer. Open for requirement deconstruction.'
                        : rawSummary;

                    const deliverables =
                      tender.keyDeliverables || tender.enrichment?.scopeAndSpec?.buyerKeyDeliverables || [];
                    const criticalFlags =
                      tender.criticalFlags || tender.enrichment?.criticalFlags || [];
                    const completeness = tender.completeness || tender.enrichment?.completeness;

                    const isExpired =
                      tender.isArchived ||
                      tender.daysRemaining === 0 ||
                      tender.lifecycleStatus === 'EXPIRED';

                    return (
                      <article
                        key={tender.id}
                        className="p-5 bg-gallery-surface hover:bg-gallery-canvas/70 border border-gallery-border rounded-xl transition-all shadow-2xs hover:shadow-xs space-y-3"
                      >
                        {/* Top Header Strip */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gallery-border/60 pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-gallery-charcoal">
                              {tender.buyerName || 'Public Contracting Authority'}
                            </span>
                            <span className="text-xs text-gallery-faint">•</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                              {sourceLabel}
                            </span>
                            <span className="text-[10px] font-mono text-gallery-muted">
                              {tender.canonicalReference}
                            </span>
                            {tender.procurementStage && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gallery-surfaceMuted border border-gallery-border text-gallery-muted">
                                {tender.procurementStage.toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                tender.qualification === 'STRONG'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : tender.qualification === 'POSSIBLE'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                              }`}
                            >
                              FIT: {tender.qualification}
                            </span>
                            {completeness && (
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                  completeness.status === 'COMPLETE'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {completeness.score}/{completeness.total} facts ({completeness.percentage}%)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Summary */}
                        <div className="space-y-1.5">
                          <h2 className="text-base font-bold text-gallery-charcoal hover:text-tender-primary transition-colors leading-snug">
                            <Link href={detailHref}>{tender.title}</Link>
                          </h2>
                          <p className="text-xs text-gallery-muted line-clamp-2 leading-relaxed">
                            {cleanSummary}
                          </p>
                        </div>

                        {/* Deliverables & Capability Chips */}
                        {(deliverables.length > 0 || (tender.serviceTags && tender.serviceTags.length > 0)) && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {deliverables.slice(0, 3).map((d: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 truncate max-w-[240px]"
                              >
                                {d}
                              </span>
                            ))}
                            {tender.serviceTags &&
                              tender.serviceTags.slice(0, 4).map((tag: string) => (
                                <span
                                  key={tag}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gallery-surfaceMuted text-gallery-muted"
                                >
                                  #{tag}
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Critical Actionable Flags */}
                        {criticalFlags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {criticalFlags.slice(0, 2).map((flag: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200"
                              >
                                {flag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Bottom Commercial Strip & Action Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gallery-border/60 pt-3">
                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                            <div>
                              <span className="text-gallery-muted text-[11px] block">Contract Value</span>
                              <strong className="text-gallery-charcoal font-bold">
                                {tender.valueDescription ||
                                  (tender.valueAmount
                                    ? `£${tender.valueAmount.toLocaleString()}`
                                    : 'Budget not disclosed')}
                              </strong>
                            </div>

                            <div className="h-6 w-[1px] bg-gallery-border hidden sm:block" />

                            <div>
                              <span className="text-gallery-muted text-[11px] block">Submission Deadline</span>
                              {tender.submissionDeadline ? (
                                tender.daysRemaining !== null && tender.daysRemaining !== undefined ? (
                                  tender.daysRemaining === 0 ? (
                                    <span className="text-red-700 font-bold">Deadline Expired</span>
                                  ) : (
                                    <span className="text-gallery-charcoal font-medium">
                                      {new Date(tender.submissionDeadline).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })}{' '}
                                      <span className="text-tender-primary font-bold">
                                        ({tender.daysRemaining}d remaining)
                                      </span>
                                    </span>
                                  )
                                ) : (
                                  <span className="text-gallery-charcoal">
                                    {new Date(tender.submissionDeadline).toLocaleDateString('en-GB')}
                                  </span>
                                )
                              ) : (
                                <span className="text-amber-800 bg-amber-50 border border-amber-200 text-[10px] px-1.5 py-0.5 rounded">
                                  Not specified
                                </span>
                              )}
                            </div>

                            {(tender.smeSuitable || tender.vcseSuitable) && (
                              <>
                                <div className="h-6 w-[1px] bg-gallery-border hidden sm:block" />
                                <div className="flex items-center gap-1">
                                  {tender.smeSuitable && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                                      SME
                                    </span>
                                  )}
                                  {tender.vcseSuitable && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-semibold">
                                      VCSE
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <Link
                              href={detailHref}
                              className="px-3.5 py-1.5 bg-gallery-charcoal hover:bg-black text-white text-xs font-bold rounded-md transition-colors shadow-2xs inline-flex items-center gap-1.5"
                            >
                              <span>View Full Analysis</span>
                            </Link>

                            {tender.officialNoticeUrl && (
                              <a
                                href={tender.officialNoticeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open official public notice"
                                aria-label="Open official public notice"
                                className="p-1.5 text-gallery-faint hover:text-gallery-charcoal transition-colors rounded-md hover:bg-gallery-surfaceMuted inline-flex items-center border border-gallery-border"
                              >
                                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                              </a>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* TAB 2: MY BIDS */}
      {activeTab === 'MY BIDS' && (
        <div className="space-y-4">
          <ApplicationsView
            applications={applications}
            basePath={basePath}
            isReviewMode={isReviewMode}
          />
        </div>
      )}

      {/* TAB 3: SOURCES & COVERAGE */}
      {activeTab === 'SOURCES & COVERAGE' && (
        <div className="space-y-4">
          <SourcesCoverageView basePath={basePath} isReviewMode={isReviewMode} />
        </div>
      )}
    </div>
  );
}
