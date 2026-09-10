"use client";

import React, { useState } from "react";
import { Opportunity, PipelineStage } from "@/lib/types";
import { Kanban, ChevronRight, ChevronLeft, Calendar, FileText, Sparkles, Building2, ArrowRight } from "lucide-react";
import { MeetingBriefModal } from "@/components/pipeline/MeetingBriefModal";
import { ProposalModal } from "@/components/pipeline/ProposalModal";

interface PipelineWorkspaceProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onMoveStage: (oppId: string, stage: PipelineStage) => void;
}

const activePipelineStages: { id: PipelineStage; title: string }[] = [
  { id: "qualified", title: "Qualified" },
  { id: "contact_ready", title: "Contact Ready" },
  { id: "contacted", title: "Contacted" },
  { id: "replied", title: "Replied" },
  { id: "meeting_booked", title: "Meeting Booked" },
  { id: "proposal", title: "Proposal" },
  { id: "won", title: "Won Projects" },
];

export function PipelineWorkspace({
  opportunities,
  onSelectOpportunity,
  onMoveStage,
}: PipelineWorkspaceProps) {
  const [selectedMeetingOpp, setSelectedMeetingOpp] = useState<Opportunity | null>(null);
  const [selectedProposalOpp, setSelectedProposalOpp] = useState<Opportunity | null>(null);

  const getStageTotalValue = (stage: PipelineStage) => {
    return opportunities
      .filter((o) => o.pipelineStage === stage)
      .reduce((sum, o) => sum + o.estimatedValueGbp, 0);
  };

  const stageOrder: PipelineStage[] = [
    "discovered",
    "researched",
    "qualified",
    "contact_ready",
    "contacted",
    "replied",
    "meeting_booked",
    "discovery",
    "proposal",
    "negotiation",
    "won",
  ];

  const advanceStage = (opp: Opportunity) => {
    const currentIndex = stageOrder.indexOf(opp.pipelineStage);
    if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
      onMoveStage(opp.id, stageOrder[currentIndex + 1]);
    }
  };

  const retreatStage = (opp: Opportunity) => {
    const currentIndex = stageOrder.indexOf(opp.pipelineStage);
    if (currentIndex > 0) {
      onMoveStage(opp.id, stageOrder[currentIndex - 1]);
    }
  };

  const activeDealsTotal = opportunities
    .filter((o) => o.pipelineStage !== "rejected" && o.pipelineStage !== "lost")
    .reduce((sum, o) => sum + o.estimatedValueGbp, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#e5e5eb] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-sans text-slate-700 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1.5">
            <Kanban className="w-3.5 h-3.5" />
            SALES (DOWNSTREAM) • ACTIVE SALES PIPELINE (SECTION 26)
          </div>
          <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
            Sales Pipeline
          </h1>
          <p className="text-sm font-semibold text-[#111116] mt-1">
            Where qualified prospects convert into paid commissions and long-term relationships.
          </p>
          <p className="text-xs text-[#6b6e7d] mt-0.5">
            Customer acquisition happens upstream; downstream deals retain their acquisition origin permanently.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-[#e5e5eb] rounded-xl text-xs flex items-center gap-2 shadow-xs">
            <span className="text-[#6b6e7d] font-medium">Active Pipeline Value:</span>
            <strong className="text-emerald-700 font-bold font-mono text-sm">
              £{activeDealsTotal.toLocaleString("en-GB")}
            </strong>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3.5 overflow-x-auto pb-4">
        {activePipelineStages.map((col) => {
          const colOpps = opportunities.filter((o) => o.pipelineStage === col.id);
          const colValue = getStageTotalValue(col.id);

          return (
            <div
              key={col.id}
              className="bg-[#f8f8fa] border border-[#e5e5eb] rounded-2xl flex flex-col min-w-[210px] max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-[#e5e5eb] flex items-center justify-between bg-white rounded-t-2xl">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-[#111116] uppercase font-sans">
                    {col.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#f1f1f5] text-[#4a4d5a] font-bold">
                    {colOpps.length}
                  </span>
                </div>
                <div className="text-[11px] font-mono font-bold text-[#6b6e7d]">
                  £{(colValue / 1000).toFixed(1)}k
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1">
                {colOpps.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8e919f] italic">
                    Empty stage
                  </div>
                ) : (
                  colOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-white hover:border-[#cfcfd8] border border-[#e5e5eb] rounded-xl p-3 space-y-2 shadow-xs transition-all text-xs"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span
                          onClick={() => onSelectOpportunity(opp)}
                          className="font-bold text-xs text-[#111116] cursor-pointer hover:underline truncate"
                        >
                          {opp.company?.name}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-emerald-700 shrink-0">
                          {opp.estimatedValueRange}
                        </span>
                      </div>

                      {/* Origin Engine Tag (Section 26) */}
                      <div className="flex items-center gap-1 text-[9px] font-sans font-bold uppercase text-[#6b6e7d]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#111116]" />
                        <span>Origin: {opp.acquisitionEngine.replace("_", " ")}</span>
                      </div>

                      <p className="text-[11px] text-[#4a4d5a] line-clamp-2">
                        {opp.title}
                      </p>

                      {/* Modal Triggers */}
                      {(col.id === "meeting_booked" || opp.meetingBrief) && (
                        <button
                          onClick={() => setSelectedMeetingOpp(opp)}
                          className="w-full py-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Meeting Brief</span>
                        </button>
                      )}

                      {(col.id === "proposal" || opp.proposalBrief) && (
                        <button
                          onClick={() => setSelectedProposalOpp(opp)}
                          className="w-full py-1 px-2 bg-violet-50 hover:bg-violet-100 text-violet-900 border border-violet-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Studio Proposal</span>
                        </button>
                      )}

                      {/* Transition arrows */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-[#f1f1f5]">
                        <button
                          onClick={() => retreatStage(opp)}
                          title="Move Back"
                          className="p-1 hover:bg-[#f1f1f5] rounded text-[#8e919f] hover:text-[#111116]"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[9px] font-mono text-[#8e919f]">
                          Score: {opp.actionScore}
                        </span>
                        <button
                          onClick={() => advanceStage(opp)}
                          title="Advance Stage"
                          className="p-1 hover:bg-[#f1f1f5] rounded text-[#8e919f] hover:text-[#111116]"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {selectedMeetingOpp && (
        <MeetingBriefModal
          opportunity={selectedMeetingOpp}
          onClose={() => setSelectedMeetingOpp(null)}
        />
      )}
      {selectedProposalOpp && (
        <ProposalModal
          opportunity={selectedProposalOpp}
          onClose={() => setSelectedProposalOpp(null)}
        />
      )}
    </div>
  );
}
