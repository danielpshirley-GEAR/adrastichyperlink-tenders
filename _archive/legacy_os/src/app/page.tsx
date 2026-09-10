"use client";

import React, { useState, useEffect } from "react";
import {
  Opportunity,
  ProcurementTender,
  FrameworkItem,
  RelationshipPartner,
  ClientAccount,
  CommercialAnalytics,
  SupplierReadinessCheck,
  DailyWorkItem,
  FocusTask,
  Company,
  Contact,
  BrandRoute,
  AppMode,
  PipelineStage,
  LeadFeedback,
} from "@/lib/types";

import { CategorizedSidebar, WorkspaceId } from "@/components/layout/CategorizedSidebar";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { UniversalAiCommandBar } from "@/components/layout/UniversalAiCommandBar";
import { SmartCaptureModal } from "@/components/layout/SmartCaptureModal";
import { CommercialCalendarModal } from "@/components/layout/CommercialCalendarModal";
import { SearchModal } from "@/components/layout/SearchModal";
import { OpportunityDrawer } from "@/components/opportunities/OpportunityDrawer";
import { OutreachComposer } from "@/components/opportunities/OutreachComposer";

// Workspaces
import { TodayMissionControl } from "@/components/workspaces/TodayMissionControl";
import { ActiveBuyersWorkspace } from "@/components/workspaces/ActiveBuyersWorkspace";
import { BusinessSignalsWorkspace } from "@/components/workspaces/BusinessSignalsWorkspace";
import { InternalNeedsWorkspace } from "@/components/workspaces/InternalNeedsWorkspace";
import { InHouseCapacityWorkspace } from "@/components/workspaces/InHouseCapacityWorkspace";
import { AgencyOverflowWorkspace } from "@/components/workspaces/AgencyOverflowWorkspace";
import { CommissionsRfpsWorkspace } from "@/components/workspaces/CommissionsRfpsWorkspace";
import { PublicTendersWorkspace } from "@/components/workspaces/PublicTendersWorkspace";
import { FrameworksWorkspace } from "@/components/workspaces/FrameworksWorkspace";
import { RecruitersFreelanceWorkspace } from "@/components/workspaces/RecruitersFreelanceWorkspace";
import { PartnersMultipliersWorkspace } from "@/components/workspaces/PartnersMultipliersWorkspace";
import { InboundAuthorityWorkspace } from "@/components/workspaces/InboundAuthorityWorkspace";
import { ClientExpansionWorkspace } from "@/components/workspaces/ClientExpansionWorkspace";

// Management Workspaces
import { PipelineWorkspace } from "@/components/management/PipelineWorkspace";
import { CompaniesWorkspace } from "@/components/management/CompaniesWorkspace";
import { ContactsWorkspace } from "@/components/management/ContactsWorkspace";
import { ProposalsWorkspace } from "@/components/management/ProposalsWorkspace";
import { ResearchCentreWorkspace } from "@/components/management/ResearchCentreWorkspace";
import { SearchEngineControlCentre } from "@/components/workspaces/SearchEngineControlCentre";
import { AnalyticsWorkspace } from "@/components/management/AnalyticsWorkspace";

// Fallback seed data
import {
  initialOpportunities,
  initialTenders,
  initialFrameworks,
  initialRelationships,
  initialClients,
  initialCompanies,
  initialContacts,
  initialSupplierReadinessChecks,
  initialDailyWorkItems,
  initialFocusTasks,
  initialAnalytics,
} from "@/lib/data/initialData";

export default function MasterApp() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>("today");
  const [currentBrand, setCurrentBrand] = useState<BrandRoute>("adrastichyperlink");
  const [appMode, setAppMode] = useState<AppMode>("demo");

  // Shared Data State
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [tenders, setTenders] = useState<ProcurementTender[]>(initialTenders);
  const [frameworks, setFrameworks] = useState<FrameworkItem[]>(initialFrameworks);
  const [relationships, setRelationships] = useState<RelationshipPartner[]>(initialRelationships);
  const [clients, setClients] = useState<ClientAccount[]>(initialClients);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [readinessChecks, setReadinessChecks] = useState<SupplierReadinessCheck[]>(initialSupplierReadinessChecks);
  const [dailyWorkItems, setDailyWorkItems] = useState<DailyWorkItem[]>(initialDailyWorkItems);
  const [focusTasks, setFocusTasks] = useState<FocusTask[]>(initialFocusTasks);
  const [analytics, setAnalytics] = useState<CommercialAnalytics>(initialAnalytics);

  // Modals & Sliders
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [outreachOpp, setOutreachOpp] = useState<Opportunity | null>(null);
  const [outreachInitialTab, setOutreachInitialTab] = useState<"email" | "linkedin" | "call">("email");
  const [isSmartCaptureOpen, setIsSmartCaptureOpen] = useState(false);
  const [isAiBarOpen, setIsAiBarOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Refresh data from API
  const refreshData = async () => {
    try {
      const [oppRes, tendRes, frmRes, relRes, cliRes, anaRes, readRes, focRes, modeRes] =
        await Promise.all([
          fetch("/api/opportunities"),
          fetch("/api/tenders"),
          fetch("/api/frameworks"),
          fetch("/api/relationships"),
          fetch("/api/clients"),
          fetch("/api/analytics"),
          fetch("/api/readiness"),
          fetch("/api/focus-tasks"),
          fetch("/api/app-mode"),
        ]);

      if (modeRes.ok) {
        const modeData = await modeRes.json();
        if (modeData.appMode) {
          setAppMode(modeData.appMode);
        }
      }

      if (oppRes.ok) {
        const data = await oppRes.json();
        setOpportunities(data.opportunities || []);
      }
      if (tendRes.ok) {
        const data = await tendRes.json();
        setTenders(data.tenders || []);
      }
      if (frmRes.ok) {
        const data = await frmRes.json();
        setFrameworks(data.frameworks || []);
      }
      if (relRes.ok) {
        const data = await relRes.json();
        setRelationships(data.relationships || []);
      }
      if (cliRes.ok) {
        const data = await cliRes.json();
        setClients(data.clients || []);
      }
      if (anaRes.ok) {
        const data = await anaRes.json();
        const rawAnalytics = data.analytics || initialAnalytics;
        const mergedAnalytics: CommercialAnalytics = {
          ...initialAnalytics,
          ...rawAnalytics,
          capital: {
            ...initialAnalytics.capital,
            ...(rawAnalytics.capital || {}),
            costBreakdown: {
              ...initialAnalytics.capital.costBreakdown,
              ...(rawAnalytics.capital?.costBreakdown || {}),
            },
          },
        };
        setAnalytics(mergedAnalytics);
      }
      if (readRes.ok) {
        const data = await readRes.json();
        setReadinessChecks(data.readinessChecks || initialSupplierReadinessChecks);
      }
      if (focRes.ok) {
        const data = await focRes.json();
        setFocusTasks(data.focusTasks || initialFocusTasks);
        setDailyWorkItems(data.dailyWorkItems || initialDailyWorkItems);
      }
    } catch (err) {
      console.warn("Could not fetch API, using in-memory state:", err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [appMode]);

  // URL query parameter support for direct screen links & deep auditing
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ws = params.get("workspace") as WorkspaceId;
      if (ws) setActiveWorkspace(ws);
      const mode = params.get("mode") as AppMode;
      if (mode && (mode === "live" || mode === "demo")) {
        setAppMode(mode);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const oppId = params.get("oppId");
      if (oppId && opportunities.length > 0) {
        const found = opportunities.find((o) => o.id === oppId);
        if (found) setSelectedOpp(found);
      }
    }
  }, [opportunities]);

  // Global Keyboard Shortcuts (Cmd+K for search, Cmd+J for AI)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsAiBarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Mode toggle
  const handleToggleAppMode = async (mode: AppMode) => {
    setAppMode(mode);
    try {
      await fetch("/api/app-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      await refreshData();
    } catch (err) {
      console.error("Failed to update app mode:", err);
    }
  };

  // Move stage
  const handleMoveStage = async (oppId: string, stage: PipelineStage) => {
    try {
      await fetch(`/api/opportunities/${oppId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      await refreshData();
    } catch (err) {
      console.error("Failed to move stage:", err);
    }

    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, pipelineStage: stage } : o))
    );
    if (selectedOpp && selectedOpp.id === oppId) {
      setSelectedOpp((prev) => (prev ? { ...prev, pipelineStage: stage } : null));
    }
  };

  // Create captured opportunity
  const handleCreateCaptured = async (oppData: any) => {
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(oppData),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (err) {
      console.error("Failed to create opportunity:", err);
    }
  };

  // Complete focus task
  const handleCompleteFocusTask = async (taskId: string) => {
    try {
      await fetch("/api/focus-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      await refreshData();
    } catch (err) {
      console.error("Failed to complete focus task:", err);
    }

    setFocusTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );
  };

  // Submit feedback on an opportunity
  const handleFeedback = async (oppId: string, feedback: LeadFeedback) => {
    try {
      await fetch(`/api/opportunities/${oppId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      await refreshData();
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }

    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === oppId
          ? {
              ...o,
              feedback,
              feedbackAt: new Date().toISOString(),
              pipelineStage:
                feedback === "wrong" ||
                feedback === "not_our_work" ||
                feedback === "too_old" ||
                feedback === "wrong_buyer" ||
                feedback === "no_budget"
                  ? "rejected"
                  : o.pipelineStage,
            }
          : o
      )
    );
    if (selectedOpp && selectedOpp.id === oppId) {
      setSelectedOpp((prev) =>
        prev
          ? {
              ...prev,
              feedback,
              feedbackAt: new Date().toISOString(),
              pipelineStage:
                feedback === "wrong" ||
                feedback === "not_our_work" ||
                feedback === "too_old" ||
                feedback === "wrong_buyer" ||
                feedback === "no_budget"
                  ? "rejected"
                  : prev.pipelineStage,
            }
          : null
      );
    }
  };

  const handleOpenOutreach = (
    opp: Opportunity,
    tab: "email" | "linkedin" | "call" = "email"
  ) => {
    setOutreachOpp(opp);
    setOutreachInitialTab(tab);
  };

  const urgentCount = opportunities.filter(
    (o) => o.actionScore >= 90 && o.pipelineStage !== "rejected"
  ).length;

  return (
    <div className="flex h-screen overflow-hidden bg-studio-bg text-studio-text">
      {/* Categorized Workstation Sidebar */}
      <CategorizedSidebar
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        urgentCount={urgentCount}
        mode={appMode}
      />

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Header */}
        <GlobalHeader
          currentBrand={currentBrand}
          onChangeBrand={setCurrentBrand}
          appMode={appMode}
          onToggleAppMode={handleToggleAppMode}
          growthCapitalRemainingGbp={analytics?.capital?.remainingGbp ?? initialAnalytics.capital.remainingGbp}
          growthCapitalTotalSpentGbp={analytics?.capital?.totalSpentGbp ?? initialAnalytics.capital.totalSpentGbp}
          totalAiCostGbp={analytics?.capital?.costBreakdown?.ai ?? initialAnalytics.capital.costBreakdown.ai}
          onOpenNewModal={() => setIsSmartCaptureOpen(true)}
          onOpenSearchModal={() => setIsSearchModalOpen(true)}
          onOpenAiBar={() => setIsAiBarOpen(true)}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          onResetData={async () => {
            if (!confirm("Reset database state to defaults?")) return;
            await fetch("/api/db/reset", { method: "POST" });
            await refreshData();
          }}
        />

        {/* Demo Mode Notice Banner (Section 54 & 55) */}
        {appMode === "demo" && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-1.5 flex items-center justify-between text-[11px] font-mono text-amber-300 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>
                <strong>DEMO MODE ACTIVE:</strong> Records are simulated test scenarios. Switch to <strong>LIVE DATA</strong> in the header for real commercial tracking.
              </span>
            </div>
            <span className="text-[10px] opacity-80 uppercase">Section 54 Data Integrity</span>
          </div>
        )}

        {/* Dynamic Workspace Container */}
        <main className="flex-1 overflow-y-auto">
          {activeWorkspace === "today" && (
            <TodayMissionControl
              opportunities={opportunities}
              analytics={analytics}
              dailyWorkItems={dailyWorkItems}
              focusTasks={focusTasks}
              appMode={appMode}
              onSelectWorkspace={setActiveWorkspace}
              onSelectOpportunity={setSelectedOpp}
              onOpenOutreachModal={handleOpenOutreach}
              onCompleteFocusTask={handleCompleteFocusTask}
              onMoveStage={handleMoveStage}
            />
          )}

          {activeWorkspace === "active_buyers" && (
            <ActiveBuyersWorkspace
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpp}
              onOpenOutreachModal={handleOpenOutreach}
              onMoveStage={handleMoveStage}
              onFeedback={handleFeedback}
            />
          )}

          {activeWorkspace === "business_signals" && (
            <BusinessSignalsWorkspace
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpp}
              onOpenOutreachModal={handleOpenOutreach}
            />
          )}

          {activeWorkspace === "internal_needs" && (
            <InternalNeedsWorkspace
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpp}
              onOpenOutreachModal={handleOpenOutreach}
            />
          )}

          {activeWorkspace === "in_house_capacity" && (
            <InHouseCapacityWorkspace
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpp}
              onOpenOutreachModal={handleOpenOutreach}
            />
          )}

          {activeWorkspace === "agency_overflow" && (
            <AgencyOverflowWorkspace
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpp}
              onOpenOutreachModal={handleOpenOutreach}
            />
          )}

          {activeWorkspace === "commissions_rfps" && (
            <CommissionsRfpsWorkspace
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpp}
              onOpenOutreachModal={handleOpenOutreach}
            />
          )}

          {activeWorkspace === "public_tenders" && (
            <PublicTendersWorkspace
              tenders={tenders}
              readinessChecks={readinessChecks}
            />
          )}

          {activeWorkspace === "frameworks" && (
            <FrameworksWorkspace frameworks={frameworks} />
          )}

          {activeWorkspace === "recruiters_freelance" && (
            <RecruitersFreelanceWorkspace />
          )}

          {activeWorkspace === "partners_multipliers" && (
            <PartnersMultipliersWorkspace relationships={relationships} />
          )}

          {activeWorkspace === "inbound_authority" && (
            <InboundAuthorityWorkspace />
          )}

          {activeWorkspace === "client_expansion" && (
            <ClientExpansionWorkspace clients={clients} />
          )}

          {activeWorkspace === "pipeline" && (
            <PipelineWorkspace
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpp}
              onMoveStage={handleMoveStage}
            />
          )}

          {activeWorkspace === "companies" && (
            <CompaniesWorkspace companies={companies} />
          )}

          {activeWorkspace === "contacts" && (
            <ContactsWorkspace contacts={contacts} />
          )}

          {activeWorkspace === "proposals" && (
            <ProposalsWorkspace opportunities={opportunities} />
          )}

          {activeWorkspace === "calendar" && (
            <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#e2e2ea] pb-6 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-sans text-[#636375] uppercase tracking-wider font-bold mb-1">
                    SALES PIPELINE • COMMERCIAL SCHEDULE (SECTION 51)
                  </div>
                  <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
                    Commercial Calendar & Timetable
                  </h1>
                </div>
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  className="px-4 py-2 bg-[#111116] text-white font-bold text-xs rounded-xl hover:bg-[#23232c] shadow-xs"
                >
                  Open Full Screen Schedule
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-[#e2e2ea] p-6 rounded-2xl shadow-xs space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#636375]">This Week's Deadlines</span>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-[#fafafb] rounded-xl border border-[#e2e2ea] flex justify-between">
                      <div>
                        <div className="font-bold text-[#111116]">Nexus Health Robotics</div>
                        <div className="text-[#636375]">Urgent LinkedIn response to Sophie Tremblay</div>
                      </div>
                      <span className="font-mono text-rose-600 font-bold">Today 16:30</span>
                    </div>
                    <div className="p-3 bg-[#fafafb] rounded-xl border border-[#e2e2ea] flex justify-between">
                      <div>
                        <div className="font-bold text-[#111116]">Verve & Co Creative</div>
                        <div className="text-[#636375]">Step 2 follow-up for drinks motion overflow</div>
                      </div>
                      <span className="font-mono text-amber-700 font-bold">Tomorrow 10:00</span>
                    </div>
                    <div className="p-3 bg-[#fafafb] rounded-xl border border-[#e2e2ea] flex justify-between">
                      <div>
                        <div className="font-bold text-[#111116]">Maison Saint-Honoré</div>
                        <div className="text-[#636375]">Submit 3D interactive luxury campaign credentials</div>
                      </div>
                      <span className="font-mono text-blue-700 font-bold">Friday 14:00</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-[#e2e2ea] p-6 rounded-2xl shadow-xs space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#636375]">Upcoming Procurement Windows</span>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-[#fafafb] rounded-xl border border-[#e2e2ea] flex justify-between">
                      <div>
                        <div className="font-bold text-[#111116]">NHS Digital & ICB Motion Framework</div>
                        <div className="text-[#636375]">Final tender questionnaire submission (£45k)</div>
                      </div>
                      <span className="font-mono text-emerald-700 font-bold">In 18 Days</span>
                    </div>
                    <div className="p-3 bg-[#fafafb] rounded-xl border border-[#e2e2ea] flex justify-between">
                      <div>
                        <div className="font-bold text-[#111116]">SUPC Universities Digital Roster</div>
                        <div className="text-[#636375]">DPS portal open for agency applications</div>
                      </div>
                      <span className="font-mono text-[#636375]">October 15</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeWorkspace === "research_centre" && (
            <ResearchCentreWorkspace />
          )}

          {activeWorkspace === "sources_schedules" && (
            <SearchEngineControlCentre />
          )}

          {activeWorkspace === "analytics" && (
            <AnalyticsWorkspace analytics={analytics} />
          )}

          {activeWorkspace === "ai_costs" && (
            <SearchEngineControlCentre />
          )}

          {activeWorkspace === "settings" && (
            <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#e2e2ea] pb-6 flex items-end justify-between">
                <div>
                  <div className="text-[11px] font-sans text-[#636375] uppercase tracking-wider font-bold mb-1">
                    STUDIO INFRASTRUCTURE • DATA GOVERNANCE & SETTINGS
                  </div>
                  <h1 className="text-3xl font-extrabold text-[#111116] tracking-tight studio-display">
                    Settings & System Control
                  </h1>
                  <p className="text-xs text-[#636375] mt-1 font-medium">
                    Manage studio brain state, growth fund allocation, and inbound webhook integrations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-[#e2e2ea] p-6 rounded-2xl space-y-4 shadow-xs">
                  <h3 className="text-base font-bold text-[#111116]">Database State & Export</h3>
                  <p className="text-xs text-[#636375] leading-relaxed">
                    Export the current canonical state of Adrastichyperlink BD OS as JSON or reset the test sandbox.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        const blob = new Blob(
                          [JSON.stringify({ opportunities, tenders, frameworks, relationships, clients, analytics }, null, 2)],
                          { type: "application/json" }
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `adrastichyperlink-bd-export-${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                      }}
                      className="px-4 py-2 bg-[#111116] text-white text-xs font-bold rounded-xl hover:bg-[#23232c] shadow-xs"
                    >
                      Export Brain JSON
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Reset database state to defaults?")) return;
                        await fetch("/api/db/reset", { method: "POST" });
                        await refreshData();
                      }}
                      className="px-4 py-2 bg-[#fafafb] hover:bg-rose-50 text-rose-600 border border-[#e2e2ea] text-xs font-bold rounded-xl"
                    >
                      Reset DB
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[#e2e2ea] p-6 rounded-2xl space-y-4 shadow-xs">
                  <h3 className="text-base font-bold text-[#111116]">Growth Capital & AI Guardrails</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#e2e2ea]">
                      <span className="text-[#636375]">Allocated Growth Fund:</span>
                      <span className="font-mono font-bold text-[#111116]">£5,000.00</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#e2e2ea]">
                      <span className="text-[#636375]">Total Spend to Date:</span>
                      <span className="font-mono font-bold text-rose-600">£{analytics.capital?.totalSpentGbp || 140}.00</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#e2e2ea]">
                      <span className="text-[#636375]">Remaining Capital:</span>
                      <span className="font-mono font-bold text-emerald-700">£{analytics.capital?.remainingGbp || 4860}.00</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#636375]">Max Research Cost per Lead:</span>
                      <span className="font-mono font-bold text-[#111116]">£0.45 (Tier 4 Cap)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Intelligence Dossier Slide-Over */}
      <OpportunityDrawer
        opportunity={selectedOpp}
        onClose={() => setSelectedOpp(null)}
        onMoveStage={handleMoveStage}
        onOpenOutreachModal={handleOpenOutreach}
        onFeedback={handleFeedback}
      />

      {/* Outreach Composer Modal */}
      <OutreachComposer
        opportunity={outreachOpp}
        initialTab={outreachInitialTab}
        onClose={() => setOutreachOpp(null)}
        onMarkContacted={(id) => handleMoveStage(id, "contacted")}
      />

      {/* Smart Paste / Capture Modal (Section 49) */}
      <SmartCaptureModal
        isOpen={isSmartCaptureOpen}
        onClose={() => setIsSmartCaptureOpen(false)}
        onCaptured={handleCreateCaptured}
      />

      {/* Universal AI Command Assistant (Section 50) */}
      <UniversalAiCommandBar
        isOpen={isAiBarOpen}
        onClose={() => setIsAiBarOpen(false)}
      />

      {/* Commercial Calendar (Section 51) */}
      <CommercialCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />

      {/* Global Cmd+K Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        opportunities={opportunities}
        tenders={tenders}
        relationships={relationships}
        onSelectOpportunity={(opp) => {
          setSelectedOpp(opp);
          setIsSearchModalOpen(false);
        }}
      />
    </div>
  );
}
