"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, Send, ArrowRight, CornerDownLeft } from "lucide-react";

interface UniversalAiCommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (actionText: string) => void;
}

export function UniversalAiCommandBar({
  isOpen,
  onClose,
  onSelectAction,
}: UniversalAiCommandBarProps) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsThinking(true);
    setResponse(null);

    // Heuristic assistant answering Adrastichyperlink BD queries
    setTimeout(() => {
      const q = query.toLowerCase();
      let answer = "";

      if (q.includes("nexus") || q.includes("score")) {
        answer =
          "Nexus Health Robotics scored 94 Lead / 99 Action because: (1) Explicit buyer search posted <1h ago (+30), (2) Confirmed £8.2M Balderton funding (+25), (3) High multi-capability fit with 3D surgical motion (+15), (4) Direct VP Marketing identified (+10). Recommendation: Respond via LinkedIn and follow up within 30 minutes.";
      } else if (q.includes("verve") || q.includes("agency")) {
        answer =
          "Verve & Co Creative won a tier-1 global drinks account 2 days ago and has an open freelance motion role. They lack in-house 3D motion direction. Recommendation: Contact Marcus Ward (ECD) offering senior plug-and-play motion capacity referencing our London Essence luxury drinks work.";
      } else if (q.includes("omniflow") || q.includes("buyer")) {
        answer =
          "Dirk Schneider (Chief Marketing Officer, ex-DHL) is the primary decision-maker. OmniFlow acquired a Nordic competitor and secured £9M growth equity. The website currently fragments two brand systems; pitch a unified brand motion explainer.";
      } else if (q.includes("next") || q.includes("today") || q.includes("do")) {
        answer =
          "Priority 1: Reply to Sophie Tremblay at Nexus Health Robotics (explicit search 35m ago). Priority 2: Review Verve & Co agency overflow outreach. Priority 3: Check NHS Digital tender supplier readiness checklist.";
      } else {
        answer =
          `Analysis for "${query}": Adrastichyperlink should prioritize high-intent opportunities where Need, Money, Intent, Timing, and Fit align. For this query, we recommend identifying the non-marketing or marketing director who controls the immediate budget.`;
      }

      setResponse(answer);
      setIsThinking(false);
    }, 400);
  };

  const samplePrompts = [
    "Why did you score Nexus Health 94?",
    "Who is the target buyer at OmniFlow Logistics?",
    "Draft an overflow pitch for Verve & Co Creative",
    "What are my highest-value actions right now?",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-start justify-center pt-24 p-4 animate-in fade-in duration-100">
      <div className="bg-white border border-[#e2e2ea] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl text-[#111116]">
        <div className="p-4 border-b border-[#e2e2ea] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-[#111116] uppercase tracking-wider font-sans">
              Universal AI Assistant (Cmd+J)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#636375] hover:text-[#111116] rounded-lg hover:bg-[#f4f4f7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAsk} className="p-4 border-b border-[#e2e2ea] flex items-center gap-3">
          <input
            autoFocus
            type="text"
            placeholder="Ask anything: 'Why did you score X?', 'Draft follow-up for Verve', 'Find agencies'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#111116] placeholder-[#8e919f] focus:outline-none font-sans"
          />
          <button
            type="submit"
            disabled={isThinking || !query.trim()}
            className="px-3.5 py-1.5 bg-[#111116] text-white font-bold text-xs rounded-xl hover:bg-[#23232c] transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
          >
            <span>Ask</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>

        <div className="p-5 max-h-96 overflow-y-auto space-y-4 text-xs">
          {isThinking && (
            <div className="flex items-center gap-2 text-[#636375] animate-pulse font-sans">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Analyzing Adrastichyperlink studio intelligence...</span>
            </div>
          )}

          {response && (
            <div className="p-4 bg-[#fafafb] rounded-xl border border-[#e2e2ea] space-y-2">
              <div className="text-[10px] font-sans uppercase text-blue-700 font-bold tracking-wider">
                Commercial Recommendation
              </div>
              <p className="text-[#111116] text-xs leading-relaxed font-sans">{response}</p>
            </div>
          )}

          {!response && !isThinking && (
            <div className="space-y-2">
              <div className="text-[10px] font-sans font-bold text-[#636375] uppercase tracking-wider">
                Quick Strategic Queries
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {samplePrompts.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setQuery(p);
                    }}
                    className="p-3 bg-[#fafafb] hover:bg-[#f0f0f4] border border-[#e2e2ea] rounded-xl text-left text-[#111116] transition-colors font-sans text-xs font-medium"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
