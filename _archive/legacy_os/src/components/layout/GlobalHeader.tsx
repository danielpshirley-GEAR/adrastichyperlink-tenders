"use client";

import React from "react";
import {
  Search,
  Plus,
  Coins,
  Sparkles,
  Calendar,
  Layers,
  Terminal,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { BrandRoute, AppMode } from "@/lib/types";

interface GlobalHeaderProps {
  currentBrand: BrandRoute;
  onChangeBrand: (brand: BrandRoute) => void;
  appMode: AppMode;
  onToggleAppMode: (mode: AppMode) => void;
  growthCapitalRemainingGbp: number;
  growthCapitalTotalSpentGbp: number;
  totalAiCostGbp: number;
  onOpenNewModal: () => void;
  onOpenSearchModal: () => void;
  onOpenAiBar: () => void;
  onOpenCalendar: () => void;
  onResetData: () => void;
}

export function GlobalHeader({
  currentBrand,
  onChangeBrand,
  appMode,
  onToggleAppMode,
  growthCapitalRemainingGbp,
  growthCapitalTotalSpentGbp,
  totalAiCostGbp,
  onOpenNewModal,
  onOpenSearchModal,
  onOpenAiBar,
  onOpenCalendar,
  onResetData,
}: GlobalHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-[#e5e5eb] px-6 flex items-center justify-between shrink-0 select-none z-10">
      {/* Left controls: Brand Route Switcher & Live vs Demo Mode */}
      <div className="flex items-center gap-3">
        {/* Brand Route Switcher */}
        <div className="flex items-center bg-[#f4f4f7] border border-[#e5e5eb] p-1 rounded-lg">
          <button
            onClick={() => onChangeBrand("adrastichyperlink")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all ${
              currentBrand === "adrastichyperlink"
                ? "bg-[#111116] text-white shadow-sm"
                : "text-[#646673] hover:text-[#111116]"
            }`}
          >
            ADRASTICHYPERLINK STUDIO
          </button>
          <button
            onClick={() => onChangeBrand("danielpshirley")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all ${
              currentBrand === "danielpshirley"
                ? "bg-[#111116] text-white shadow-sm"
                : "text-[#646673] hover:text-[#111116]"
            }`}
          >
            DANIEL P SHIRLEY (FREELANCE)
          </button>
        </div>

        {/* Live vs Demo Mode Toggle */}
        <div className="hidden lg:flex items-center bg-[#f4f4f7] border border-[#e5e5eb] p-1 rounded-lg">
          <button
            onClick={() => onToggleAppMode("demo")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-sans uppercase font-bold transition-all flex items-center gap-1.5 ${
              appMode === "demo"
                ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                : "text-[#646673] hover:text-[#111116]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>DEMO MODE</span>
          </button>
          <button
            onClick={() => onToggleAppMode("live")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-sans uppercase font-bold transition-all flex items-center gap-1.5 ${
              appMode === "live"
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs"
                : "text-[#646673] hover:text-[#111116]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>LIVE DATA</span>
          </button>
        </div>
      </div>

      {/* Right controls: Growth Fund, AI Assistant, Calendar, Search, + Capture */}
      <div className="flex items-center gap-2.5">
        {/* Growth Fund Monitor */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-[#f4f4f7] border border-[#e5e5eb] rounded-lg text-xs">
          <Coins className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[#646673] font-medium">Growth Fund:</span>
          <span className="font-mono font-bold text-[#111116]">
            £{(growthCapitalRemainingGbp ?? 4860).toLocaleString("en-GB")}
          </span>
          <span className="text-[#9699a6]">/ £5k</span>
          <span className="text-[10px] text-[#646673] font-sans ml-0.5">
            (Spent £{growthCapitalTotalSpentGbp ?? 140})
          </span>
        </div>

        {/* Universal AI Command Trigger */}
        <button
          onClick={onOpenAiBar}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f4f7] hover:bg-[#e9e9ee] border border-[#e5e5eb] rounded-lg text-xs text-[#2b2b34] hover:text-[#111116] transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline font-semibold">AI Assistant</span>
          <kbd className="hidden sm:inline font-mono text-[9px] px-1 bg-white border border-[#d5d5e2] rounded text-[#646673]">
            ⌘J
          </kbd>
        </button>

        {/* Commercial Calendar Trigger */}
        <button
          onClick={onOpenCalendar}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f4f7] hover:bg-[#e9e9ee] border border-[#e5e5eb] rounded-lg text-xs text-[#2b2b34] hover:text-[#111116] transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-[#646673]" />
          <span className="hidden sm:inline font-semibold">Calendar</span>
        </button>

        {/* Quick Search Shortcut */}
        <button
          onClick={onOpenSearchModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f4f7] hover:bg-[#e9e9ee] border border-[#e5e5eb] rounded-lg text-xs text-[#646673] hover:text-[#111116] transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <kbd className="font-mono text-[9px] px-1 bg-white border border-[#d5d5e2] rounded text-[#646673]">
            ⌘K
          </kbd>
        </button>

        {/* Reset Demo Data */}
        <button
          onClick={onResetData}
          title="Reset database state"
          className="p-2 text-[#646673] hover:text-[#111116] bg-[#f4f4f7] hover:bg-[#e9e9ee] border border-[#e5e5eb] rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Universal Smart Capture Trigger */}
        <button
          onClick={onOpenNewModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111116] hover:bg-[#23232c] text-white font-bold text-xs rounded-lg transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Capture</span>
        </button>
      </div>
    </header>
  );
}
