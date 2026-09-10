"use client";

import React, { useState, useEffect } from "react";
import { Opportunity, ProcurementTender, RelationshipPartner } from "@/lib/types";
import { Search, X, ChevronRight, Target, FileCheck, Users } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunities: Opportunity[];
  tenders: ProcurementTender[];
  relationships: RelationshipPartner[];
  onSelectOpportunity: (opp: Opportunity) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  opportunities,
  tenders,
  relationships,
  onSelectOpportunity,
}: SearchModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingOpps = opportunities
    .filter(
      (o) =>
        !q ||
        o.title.toLowerCase().includes(q) ||
        o.company?.name.toLowerCase().includes(q) ||
        o.primaryContact?.name.toLowerCase().includes(q) ||
        o.trigger.toLowerCase().includes(q)
    )
    .slice(0, 5);

  const matchingTenders = tenders
    .filter(
      (t) =>
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.buyerName.toLowerCase().includes(q)
    )
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-100">
      <div className="bg-white border border-[#e2e2ea] w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl text-[#111116]">
        <div className="p-4 border-b border-[#e2e2ea] flex items-center gap-3">
          <Search className="w-4 h-4 text-[#636375]" />
          <input
            autoFocus
            type="text"
            placeholder="Search opportunities, contacts, tenders, partners..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#111116] placeholder-[#8e919f] focus:outline-none font-sans"
          />
          <kbd className="text-[10px] font-mono px-2 py-0.5 bg-[#fafafb] text-[#636375] rounded-md border border-[#e2e2ea] font-semibold">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Opportunities */}
          {matchingOpps.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 py-1 text-[10px] font-sans font-bold uppercase tracking-wider text-[#636375] flex items-center gap-1.5">
                <Target className="w-3 h-3 text-rose-600" />
                Opportunities
              </div>
              {matchingOpps.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => {
                    onSelectOpportunity(opp);
                    onClose();
                  }}
                  className="p-3 rounded-xl hover:bg-[#fafafb] border border-transparent hover:border-[#e2e2ea] cursor-pointer flex items-center justify-between group transition-all"
                >
                  <div>
                    <div className="font-bold text-[#111116] group-hover:text-blue-700 transition-colors">
                      {opp.company?.name} — {opp.title}
                    </div>
                    <div className="text-[11px] text-[#636375] mt-0.5">
                      {opp.trigger} • {opp.estimatedValueRange}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#fafafb] text-[#111116] border border-[#e2e2ea] font-semibold">
                    Action {opp.actionScore}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tenders */}
          {matchingTenders.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 py-1 text-[10px] font-sans font-bold uppercase tracking-wider text-[#636375] flex items-center gap-1.5">
                <FileCheck className="w-3 h-3 text-emerald-600" />
                Procurement & Tenders
              </div>
              {matchingTenders.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl hover:bg-[#fafafb] border border-transparent hover:border-[#e2e2ea] cursor-pointer flex items-center justify-between transition-all"
                >
                  <div>
                    <div className="font-bold text-[#111116]">{t.title}</div>
                    <div className="text-[11px] text-[#636375] mt-0.5">
                      {t.buyerName} • {t.valueDisplay}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md uppercase font-bold ${
                      t.bidRecommendation === "bid"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {t.bidRecommendation}
                  </span>
                </div>
              ))}
            </div>
          )}

          {matchingOpps.length === 0 && matchingTenders.length === 0 && (
            <div className="py-8 text-center text-[#636375] italic font-sans">
              No results found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
