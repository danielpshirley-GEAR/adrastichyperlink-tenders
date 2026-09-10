"use client";

import React, { useState } from "react";
import { Opportunity, PipelineStage } from "@/lib/types";
import {
  X,
  Mail,
  Linkedin,
  PhoneCall,
  Video,
  Copy,
  Check,
  Send,
  Sparkles,
} from "lucide-react";
import { aiIntelligence } from "@/lib/ai/intelligence";

interface OutreachComposerProps {
  opportunity: Opportunity | null;
  initialTab?: "email" | "linkedin" | "call" | "video";
  onClose: () => void;
  onMarkContacted: (oppId: string) => void;
}

export function OutreachComposer({
  opportunity,
  initialTab = "email",
  onClose,
  onMarkContacted,
}: OutreachComposerProps) {
  if (!opportunity) return null;

  const [activeTab, setActiveTab] = useState<"email" | "linkedin" | "call" | "video">(initialTab);
  const [copied, setCopied] = useState(false);

  // Generate outreach drafts
  const outreach =
    opportunity.outreachDrafts ||
    aiIntelligence.generateOutreachDrafts(opportunity);

  const [emailSubject, setEmailSubject] = useState(outreach.emailSubject);
  const [emailBody, setEmailBody] = useState(outreach.emailBody);
  const [linkedinMsg, setLinkedinMsg] = useState(outreach.linkedinMessage);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendAndMark = () => {
    onMarkContacted(opportunity.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#e2e2ea] w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-[#111116]">
        {/* Header */}
        <div className="p-5 border-b border-[#e2e2ea] flex items-center justify-between bg-white">
          <div>
            <div className="text-[11px] font-mono text-[#636375] uppercase flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              AI OUTREACH ASSISTANT • HUMAN APPROVAL GATE (SECTION 24)
            </div>
            <h2 className="text-lg font-bold text-[#111116] tracking-tight mt-0.5 studio-display">
              Target: {opportunity.company?.name} ({opportunity.primaryContact?.name || "Target Decision Maker"})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#636375] hover:text-[#111116] rounded-lg hover:bg-[#f4f4f7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#e2e2ea] bg-[#fafafb] px-5">
          <button
            onClick={() => setActiveTab("email")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "email"
                ? "border-[#111116] text-[#111116] font-bold"
                : "border-transparent text-[#636375] hover:text-[#111116]"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Personalized Email</span>
          </button>

          <button
            onClick={() => setActiveTab("linkedin")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "linkedin"
                ? "border-[#111116] text-[#111116] font-bold"
                : "border-transparent text-[#636375] hover:text-[#111116]"
            }`}
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span>LinkedIn InMail</span>
          </button>

          <button
            onClick={() => setActiveTab("call")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "call"
                ? "border-[#111116] text-[#111116] font-bold"
                : "border-transparent text-[#636375] hover:text-[#111116]"
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call Angle & Battlecard</span>
          </button>

          {outreach.videoPitchOutline && (
            <button
              onClick={() => setActiveTab("video")}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === "video"
                  ? "border-[#111116] text-[#111116] font-bold"
                  : "border-transparent text-[#636375] hover:text-[#111116]"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>90s Video Outline</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "email" && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#636375]">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full mt-1 bg-[#fafafb] border border-[#e2e2ea] rounded-xl p-2.5 text-xs text-[#111116] font-medium focus:outline-none focus:border-[#111116] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#636375]">
                  Body (Tailored to trigger: {opportunity.trigger})
                </label>
                <textarea
                  rows={11}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full mt-1 bg-[#fafafb] border border-[#e2e2ea] rounded-xl p-3 text-xs text-[#111116] font-sans leading-relaxed focus:outline-none focus:border-[#111116] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => handleCopy(`${emailSubject}\n\n${emailBody}`)}
                  className="px-3.5 py-2 bg-[#fafafb] hover:bg-[#f0f0f4] border border-[#e2e2ea] text-[#111116] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#636375]" />}
                  <span>{copied ? "Copied to Clipboard" : "Copy Full Email"}</span>
                </button>

                <div className="text-[11px] text-[#636375] font-mono">
                  Recipient: {opportunity.primaryContact?.email || "Direct CMO email"}
                </div>
              </div>
            </div>
          )}

          {activeTab === "linkedin" && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#636375]">
                  LinkedIn Direct Message / InMail (Concise & High-Status)
                </label>
                <textarea
                  rows={8}
                  value={linkedinMsg}
                  onChange={(e) => setLinkedinMsg(e.target.value)}
                  className="w-full mt-1 bg-[#fafafb] border border-[#e2e2ea] rounded-xl p-3 text-xs text-[#111116] font-sans leading-relaxed focus:outline-none focus:border-[#111116] focus:bg-white"
                />
              </div>

              <button
                onClick={() => handleCopy(linkedinMsg)}
                className="px-3.5 py-2 bg-[#fafafb] hover:bg-[#f0f0f4] border border-[#e2e2ea] text-[#111116] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#636375]" />}
                <span>{copied ? "Copied to Clipboard" : "Copy LinkedIn Message"}</span>
              </button>
            </div>
          )}

          {activeTab === "call" && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-[#fafafb] rounded-xl border border-[#e2e2ea] space-y-1">
                <div className="text-[10px] font-sans font-bold text-[#636375] uppercase tracking-wider">Opening Hook</div>
                <div className="text-[#111116] font-semibold italic">
                  "{outreach.callAngle.openingLine}"
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-sans font-bold text-[#636375] uppercase tracking-wider">
                  3 Core Talking Points
                </div>
                {outreach.callAngle.talkingPoints.map((tp, i) => (
                  <div key={i} className="p-3 bg-[#fafafb] rounded-xl border border-[#e2e2ea] text-[#111116] flex items-start gap-2.5">
                    <span className="font-mono text-blue-700 font-bold">{i + 1}.</span>
                    <span>{tp}</span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <div className="text-[10px] font-sans text-amber-800 uppercase font-bold tracking-wider">
                  Likely Objection & Strategic Counter
                </div>
                <div className="text-xs text-[#111116] font-medium leading-relaxed">{outreach.callAngle.likelyObjection}</div>
              </div>
            </div>
          )}

          {activeTab === "video" && outreach.videoPitchOutline && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-[#fafafb] p-3 rounded-xl border border-[#e2e2ea]">
                <span className="font-sans font-bold text-[#636375] uppercase text-[10px] tracking-wider">Target Duration</span>
                <span className="font-mono font-bold text-[#111116]">
                  {outreach.videoPitchOutline.targetDurationSeconds} seconds
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-[#fafafb] rounded-xl border border-[#e2e2ea] space-y-1">
                  <div className="text-[10px] font-sans font-bold text-[#636375] uppercase tracking-wider">Hook (0–15s)</div>
                  <div className="text-[#111116]">{outreach.videoPitchOutline.hook}</div>
                </div>

                <div className="p-3 bg-[#fafafb] rounded-xl border border-[#e2e2ea] space-y-1">
                  <div className="text-[10px] font-sans font-bold text-[#636375] uppercase tracking-wider">Observation (15–45s)</div>
                  <div className="text-[#111116]">{outreach.videoPitchOutline.observation}</div>
                </div>

                <div className="p-3 bg-[#fafafb] rounded-xl border border-[#e2e2ea] space-y-1">
                  <div className="text-[10px] font-sans font-bold text-[#636375] uppercase tracking-wider">Proof Reference (45–70s)</div>
                  <div className="text-[#111116]">{outreach.videoPitchOutline.relevantWorkReference}</div>
                </div>

                <div className="p-3 bg-[#fafafb] rounded-xl border border-[#e2e2ea] space-y-1">
                  <div className="text-[10px] font-sans font-bold text-[#636375] uppercase tracking-wider">Call to Action (70–90s)</div>
                  <div className="text-[#111116] font-semibold">{outreach.videoPitchOutline.callToAction}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e2e2ea] bg-white flex items-center justify-between">
          <div className="text-[11px] text-[#636375] font-sans">
            Human approval gate: Daniel approves all outgoing communications.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-[#636375] hover:text-[#111116] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendAndMark}
              className="px-4 py-2 bg-[#111116] text-white hover:bg-[#23232c] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Approve & Mark as Contacted</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
