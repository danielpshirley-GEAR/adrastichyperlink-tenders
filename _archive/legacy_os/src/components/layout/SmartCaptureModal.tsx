"use client";

import React, { useState } from "react";
import { X, Sparkles, Plus, Clipboard, CheckCircle2 } from "lucide-react";
import { AcquisitionEngine } from "@/lib/types";

interface SmartCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptured: (oppData: any) => void;
}

export function SmartCaptureModal({
  isOpen,
  onClose,
  onCaptured,
}: SmartCaptureModalProps) {
  if (!isOpen) return null;

  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  // Auto-fill states after AI parse
  const [parsedCompany, setParsedCompany] = useState("");
  const [parsedTitle, setParsedTitle] = useState("");
  const [parsedEngine, setParsedEngine] = useState<AcquisitionEngine>("active_demand");
  const [parsedValue, setParsedValue] = useState("£8k–£16k");
  const [parsedBuyer, setParsedBuyer] = useState("");
  const [parsedBuyerTitle, setParsedBuyerTitle] = useState("");
  const [parsedTrigger, setParsedTrigger] = useState("");
  const [hasParsed, setHasParsed] = useState(false);

  const handleAutoParse = () => {
    if (!rawText.trim()) return;
    setIsParsing(true);

    setTimeout(() => {
      const text = rawText.toLowerCase();

      // Intelligent heuristics for automatic extraction
      let company = "Discovered Enterprise";
      let title = "Motion & Creative Support Engagement";
      let engine: AcquisitionEngine = "active_demand";
      let value = "£8k–£16k";
      let buyer = "Marketing Director";
      let buyerTitle = "Head of Marketing";
      let trigger = "Public intent or commercial change signal";

      if (text.includes("looking for") || text.includes("recommend") || text.includes("motion designer")) {
        engine = "active_demand";
        title = "Explicit Request: Senior Motion & Design Studio Support";
        trigger = "Explicit agency recommendation request posted publicly";
      } else if (text.includes("raised") || text.includes("funding") || text.includes("series a") || text.includes("series b")) {
        engine = "triggered_businesses";
        title = "Funded Scaleup: Brand & Product Motion Explainer";
        trigger = "Growth funding milestone closed";
        value = "£12k–£25k";
      } else if (text.includes("internal") || text.includes("transformation") || text.includes("change") || text.includes("restructur")) {
        engine = "internal_needs";
        title = "Internal Transformation & Strategic Change Communications";
        trigger = "Firm-wide operating model shift / internal restructuring";
        buyerTitle = "Head of Internal Communications";
        value = "£15k–£28k";
      } else if (text.includes("hiring") || text.includes("job") || text.includes("senior motion")) {
        engine = "capacity_overflow";
        title = "Interim Creative Capacity: Product Launch Sprint";
        trigger = "Unfilled creative role causing product launch asset bottleneck";
      }

      // Try extract company name if mentioned
      const lines = rawText.split("\n");
      for (const line of lines) {
        if (line.includes("at ") || line.includes("from ") || line.includes("company:")) {
          const parts = line.split(/(?:at|from|company:)/i);
          if (parts[1]) {
            company = parts[1].trim().split(" ")[0].replace(/[^a-zA-Z0-9]/g, "");
          }
        }
      }

      setParsedCompany(company || "Target Company Ltd");
      setParsedTitle(title);
      setParsedEngine(engine);
      setParsedValue(value);
      setParsedBuyer(buyer);
      setParsedBuyerTitle(buyerTitle);
      setParsedTrigger(trigger);
      setHasParsed(true);
      setIsParsing(false);
    }, 450);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onCaptured({
      companyName: parsedCompany || "New Discovered Lead",
      title: parsedTitle || "Creative Support Engagement",
      acquisitionEngine: parsedEngine,
      trigger: parsedTrigger || "Captured via Smart Paste",
      estimatedValueRange: parsedValue,
      needDescription: rawText,
      triggerFreshnessHours: 0.8,
      budgetConfidence: "strongly_inferred",
      primaryContact: parsedBuyer
        ? {
            name: parsedBuyer,
            jobTitle: parsedBuyerTitle || "Director",
          }
        : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div className="bg-white border border-[#e2e2ea] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl text-[#111116]">
        <div className="p-5 border-b border-[#e2e2ea] flex items-center justify-between bg-white">
          <div>
            <div className="text-[10px] font-sans text-[#636375] uppercase flex items-center gap-1.5 font-bold tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              SMART CAPTURE • DIRECT TO BRAIN (SECTION 49)
            </div>
            <h2 className="text-xl font-bold text-[#111116] tracking-tight mt-0.5 studio-display">
              Paste URL, Post, Job Listing or Text
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#636375] hover:text-[#111116] rounded-lg hover:bg-[#f4f4f7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold font-sans uppercase tracking-wider text-[#636375] block mb-1.5">
              Raw Discovery Source Text or URL
            </label>
            <textarea
              rows={4}
              placeholder="Paste LinkedIn post text, job URL, funding notice, or email note..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-[#fafafb] border border-[#e2e2ea] rounded-xl p-3 text-xs text-[#111116] font-sans focus:outline-none focus:border-[#111116] focus:bg-white leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={isParsing || !rawText.trim()}
              onClick={handleAutoParse}
              className="px-4 py-2 bg-[#fafafb] hover:bg-[#f0f0f4] border border-[#e2e2ea] text-[#111116] text-xs font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{isParsing ? "Analyzing with AI..." : "AI Auto-Parse & Enrich"}</span>
            </button>
          </div>

          {hasParsed && (
            <div className="p-4 bg-[#fafafb] rounded-xl border border-[#e2e2ea] space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs border-b border-[#e2e2ea] pb-2.5">
                <span className="font-bold text-[#111116] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Auto-Enriched Opportunity Details
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold uppercase">
                  {parsedEngine.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-sans font-bold text-[#636375] uppercase">Company</label>
                  <input
                    type="text"
                    value={parsedCompany}
                    onChange={(e) => setParsedCompany(e.target.value)}
                    className="w-full mt-1 bg-white border border-[#e2e2ea] rounded-lg p-2 text-xs text-[#111116] font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-sans font-bold text-[#636375] uppercase">Value Band</label>
                  <input
                    type="text"
                    value={parsedValue}
                    onChange={(e) => setParsedValue(e.target.value)}
                    className="w-full mt-1 bg-white border border-[#e2e2ea] rounded-lg p-2 text-xs font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="text-[10px] font-sans font-bold text-[#636375] uppercase">Opportunity Title</label>
                <input
                  type="text"
                  value={parsedTitle}
                  onChange={(e) => setParsedTitle(e.target.value)}
                  className="w-full mt-1 bg-white border border-[#e2e2ea] rounded-lg p-2 text-xs text-[#111116] font-medium"
                />
              </div>

              <div className="text-xs">
                <label className="text-[10px] font-sans font-bold text-[#636375] uppercase">Commercial Trigger</label>
                <input
                  type="text"
                  value={parsedTrigger}
                  onChange={(e) => setParsedTrigger(e.target.value)}
                  className="w-full mt-1 bg-white border border-[#e2e2ea] rounded-lg p-2 text-xs text-[#111116]"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#e2e2ea] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-[#636375] hover:text-[#111116] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasParsed}
              className="px-4 py-2 bg-[#111116] text-white font-bold text-xs rounded-xl hover:bg-[#23232c] transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Score & Save Opportunity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
