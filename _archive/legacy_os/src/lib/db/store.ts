import fs from "fs";
import path from "path";
import {
  Company,
  Contact,
  Opportunity,
  ProcurementTender,
  FrameworkItem,
  RelationshipPartner,
  ClientAccount,
  CommercialAnalytics,
  SupplierReadinessCheck,
  DailyWorkItem,
  FocusTask,
  PipelineStage,
  AppMode,
  AcquisitionEngine,
  LeadFeedback,
} from "../types";
import {
  initialCompanies,
  initialContacts,
  initialOpportunities,
  initialTenders,
  initialFrameworks,
  initialRelationships,
  initialClients,
  initialAnalytics,
  initialSupplierReadinessChecks,
  initialDailyWorkItems,
  initialFocusTasks,
} from "../data/initialData";
import { calculateLeadScore } from "../scoring/leadScore";
import { calculateActionScore } from "../scoring/actionScore";

export interface DatabaseState {
  appMode: AppMode;
  companies: Company[];
  contacts: Contact[];
  opportunities: Opportunity[];
  tenders: ProcurementTender[];
  frameworks: FrameworkItem[];
  relationships: RelationshipPartner[];
  clients: ClientAccount[];
  analytics: CommercialAnalytics;
  readinessChecks: SupplierReadinessCheck[];
  dailyWorkItems: DailyWorkItem[];
  focusTasks: FocusTask[];
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let memoryState: DatabaseState | null = null;

function ensureDataFile(): DatabaseState {
  if (memoryState) return memoryState;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      memoryState = JSON.parse(content) as DatabaseState;
      let mutated = false;
      if (!memoryState.frameworks || memoryState.frameworks.length === 0) {
        memoryState.frameworks = initialFrameworks;
        mutated = true;
      }
      if (!memoryState.readinessChecks || memoryState.readinessChecks.length === 0) {
        memoryState.readinessChecks = initialSupplierReadinessChecks;
        mutated = true;
      }
      if (!memoryState.dailyWorkItems || memoryState.dailyWorkItems.length === 0) {
        memoryState.dailyWorkItems = initialDailyWorkItems;
        mutated = true;
      }
      if (!memoryState.focusTasks || memoryState.focusTasks.length === 0) {
        memoryState.focusTasks = initialFocusTasks;
        mutated = true;
      }
      if (!memoryState.appMode) {
        memoryState.appMode = "demo";
        mutated = true;
      }
      if (!memoryState.analytics || !memoryState.analytics.capital) {
        memoryState.analytics = {
          ...initialAnalytics,
          ...(memoryState.analytics || {}),
          capital: initialAnalytics.capital,
        };
        mutated = true;
      }
      if (mutated) {
        saveState(memoryState);
      }
      return memoryState;
    }
  } catch (err) {
    console.error("Error reading db file, falling back to initial data:", err);
  }

  const freshState: DatabaseState = {
    appMode: "demo",
    companies: initialCompanies,
    contacts: initialContacts,
    opportunities: initialOpportunities,
    tenders: initialTenders,
    frameworks: initialFrameworks,
    relationships: initialRelationships,
    clients: initialClients,
    analytics: initialAnalytics,
    readinessChecks: initialSupplierReadinessChecks,
    dailyWorkItems: initialDailyWorkItems,
    focusTasks: initialFocusTasks,
    lastUpdated: new Date().toISOString(),
  };

  saveState(freshState);
  memoryState = freshState;
  return memoryState;
}

function saveState(state: DatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = path.join(DATA_DIR, `db.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`);
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
    memoryState = state;
  } catch (err) {
    console.error("Error writing db file:", err);
  }
}

export const db = {
  getState(): DatabaseState {
    return ensureDataFile();
  },

  getAppMode(): AppMode {
    const state = ensureDataFile();
    return state.appMode || "demo";
  },

  setAppMode(mode: AppMode): AppMode {
    const state = ensureDataFile();
    state.appMode = mode;
    saveState(state);
    return state.appMode;
  },

  resetToDefaults(): DatabaseState {
    const freshState: DatabaseState = {
      appMode: "demo",
      companies: initialCompanies,
      contacts: initialContacts,
      opportunities: initialOpportunities,
      tenders: initialTenders,
      frameworks: initialFrameworks,
      relationships: initialRelationships,
      clients: initialClients,
      analytics: initialAnalytics,
      readinessChecks: initialSupplierReadinessChecks,
      dailyWorkItems: initialDailyWorkItems,
      focusTasks: initialFocusTasks,
      lastUpdated: new Date().toISOString(),
    };
    saveState(freshState);
    return freshState;
  },

  getOpportunities(engine?: AcquisitionEngine): Opportunity[] {
    const state = ensureDataFile();
    let opps = state.opportunities.map((opp) => {
      const company = state.companies.find((c) => c.id === opp.companyId);
      const contact = state.contacts.find((c) => c.id === opp.primaryContactId);
      return {
        ...opp,
        company: company || opp.company,
        primaryContact: contact || opp.primaryContact,
      };
    });

    if (state.appMode === "live") {
      opps = opps.filter((o) => !o.isDemo);
    } else {
      opps = opps.filter((o) => o.isDemo);
    }

    if (engine) {
      opps = opps.filter((o) => o.acquisitionEngine === engine);
    }

    return opps;
  },

  getOpportunityById(id: string): Opportunity | undefined {
    const opps = this.getOpportunities();
    return opps.find((o) => o.id === id);
  },

  saveOpportunityFeedback(id: string, feedback: LeadFeedback): Opportunity | null {
    const state = ensureDataFile();
    const oppIndex = state.opportunities.findIndex((o) => o.id === id);
    if (oppIndex === -1) return null;

    const opp = state.opportunities[oppIndex];
    opp.feedback = feedback;
    opp.feedbackAt = new Date().toISOString();
    opp.updatedAt = new Date().toISOString();

    // Auto-update stage if disqualified
    if (
      feedback === "wrong" ||
      feedback === "not_our_work" ||
      feedback === "too_old" ||
      feedback === "wrong_buyer" ||
      feedback === "no_budget"
    ) {
      opp.pipelineStage = "rejected";
    }

    saveState(state);
    return opp;
  },

  updateOpportunityStage(id: string, stage: PipelineStage): Opportunity | null {
    const state = ensureDataFile();
    const oppIndex = state.opportunities.findIndex((o) => o.id === id);
    if (oppIndex === -1) return null;

    const opp = state.opportunities[oppIndex];
    opp.pipelineStage = stage;
    opp.updatedAt = new Date().toISOString();

    const actionResult = calculateActionScore({
      leadScore: opp.leadScore,
      triggerFreshnessHours: opp.triggerFreshnessHours,
      pipelineStage: stage,
      hasUnreadReply: stage === "replied",
      isFollowUpDue: stage === "contacted",
      isExplicitDemand: opp.acquisitionEngine === "active_demand",
    });

    opp.actionScore = actionResult.actionScore;

    if (stage === "won") {
      opp.winProbabilityPercent = 100;
      state.analytics.revenueWonGbp += opp.estimatedValueGbp;
      state.analytics.cashCollectedGbp += Math.round(opp.estimatedValueGbp * 0.5);
    }

    saveState(state);
    return opp;
  },

  createOpportunity(newOpp: Partial<Opportunity> & { title: string; companyName: string }): Opportunity {
    const state = ensureDataFile();

    const companyId = `comp-${Date.now()}`;
    const newCompany: Company = {
      id: companyId,
      name: newOpp.companyName,
      website: newOpp.company?.website || "https://example.com",
      industry: newOpp.company?.industry || "Technology & Creative",
      companyType: newOpp.company?.companyType || "scaleup",
      location: newOpp.company?.location || "UK",
      employeeCount: newOpp.company?.employeeCount || 25,
      marketingTeamSize: newOpp.company?.marketingTeamSize || 3,
      creativeTeamSize: newOpp.company?.creativeTeamSize || 0,
      creativeMaturityRating: "medium",
      creativeMaturitySummary: "Assessed by Adrastichyperlink Discovery Engine.",
      summary: newOpp.company?.summary || newOpp.needDescription || "",
      qualificationStatus: "qualified",
      lastResearchedAt: new Date().toISOString(),
      isDemo: state.appMode === "demo",
    };
    state.companies.push(newCompany);

    let contactId: string | undefined = undefined;
    if (newOpp.primaryContact?.name) {
      contactId = `cont-${Date.now()}`;
      const newContact: Contact = {
        id: contactId,
        name: newOpp.primaryContact.name,
        jobTitle: newOpp.primaryContact.jobTitle || "Director",
        companyId: companyId,
        email: newOpp.primaryContact.email,
        linkedinUrl: newOpp.primaryContact.linkedinUrl,
        roleCategory: "vp_director",
        estimatedDecisionInfluence: "high",
        verificationStatus: "verified",
        isDemo: state.appMode === "demo",
      };
      state.contacts.push(newContact);
    }

    const leadScoreCalc = calculateLeadScore({
      acquisitionEngine: newOpp.acquisitionEngine || "active_demand",
      intentSignalType:
        newOpp.acquisitionEngine === "active_demand"
          ? "explicit_request"
          : newOpp.acquisitionEngine === "public_tenders" || newOpp.acquisitionEngine === "private_rfp"
          ? "tender_rfp"
          : "strong_trigger",
      budgetConfidence: newOpp.budgetConfidence || "strongly_inferred",
      triggerFreshnessHours: newOpp.triggerFreshnessHours || 1,
      relevantCapabilitiesCount: newOpp.relevantCapabilities?.length || 2,
      hasIdentifiedBuyer: Boolean(contactId),
      buyerRoleInfluence: "high",
      hasStrategicValue: true,
    });

    const actionScoreCalc = calculateActionScore({
      leadScore: leadScoreCalc.totalScore,
      triggerFreshnessHours: newOpp.triggerFreshnessHours || 1,
      pipelineStage: "contact_ready",
      hasUnreadReply: false,
      isFollowUpDue: false,
      isExplicitDemand: newOpp.acquisitionEngine === "active_demand",
    });

    const oppId = `opp-${Date.now()}`;
    const opp: Opportunity = {
      id: oppId,
      companyId: companyId,
      company: newCompany,
      primaryContactId: contactId,
      primaryContact: state.contacts.find((c) => c.id === contactId),
      title: newOpp.title,
      acquisitionEngine: newOpp.acquisitionEngine || "active_demand",
      sourceDescription: newOpp.sourceDescription || "Smart Captured",
      trigger: newOpp.trigger || "Direct Commercial Signal",
      triggerDate: new Date().toISOString(),
      triggerFreshnessHours: newOpp.triggerFreshnessHours || 1,
      needDescription: newOpp.needDescription || "Senior strategic motion & design capabilities required.",
      relevantCapabilities: newOpp.relevantCapabilities || ["motion", "brand"],
      evidence: newOpp.evidence || [],
      leadScore: leadScoreCalc.totalScore,
      actionScore: actionScoreCalc.actionScore,
      intentScore: leadScoreCalc.intentScore,
      budgetScore: leadScoreCalc.budgetScore,
      budgetConfidence: newOpp.budgetConfidence || "strongly_inferred",
      timingScore: leadScoreCalc.timingScore,
      fitScore: leadScoreCalc.fitScore,
      buyerAccessScore: leadScoreCalc.buyerAccessScore,
      strategicValueScore: leadScoreCalc.strategicValueScore,
      estimatedValueRange: newOpp.estimatedValueRange || "£8k–£16k",
      estimatedValueGbp: newOpp.estimatedValueGbp || 12000,
      recommendedEngagement: newOpp.recommendedEngagement || "studio_project",
      recommendedAction: newOpp.recommendedAction || "Initiate direct senior outreach.",
      brandRoute: newOpp.brandRoute || "adrastichyperlink",
      pipelineStage: "contact_ready",
      nextAction: "Review outreach draft and dispatch",
      nextActionDeadline: "Today",
      winProbabilityPercent: 35,
      isUrgent: actionScoreCalc.actionScore >= 90,
      isDemo: state.appMode === "demo",
      matchedProof: [
        {
          workTitle: "The Stars Group / PokerStars — Motion Graphics & Dynamic 3D",
          isRealClientWork: true,
          relevanceRationale: "Enterprise-grade creative execution and motion systems.",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    state.opportunities.unshift(opp);
    saveState(state);
    return opp;
  },

  getTenders(): ProcurementTender[] {
    const state = ensureDataFile();
    return state.appMode === "live"
      ? state.tenders.filter((t) => !t.isDemo)
      : state.tenders;
  },

  getFrameworks(): FrameworkItem[] {
    const state = ensureDataFile();
    return state.appMode === "live"
      ? state.frameworks.filter((f) => !f.isDemo)
      : state.frameworks;
  },

  getReadinessChecks(): SupplierReadinessCheck[] {
    const state = ensureDataFile();
    return state.readinessChecks || initialSupplierReadinessChecks;
  },

  getRelationships(): RelationshipPartner[] {
    const state = ensureDataFile();
    return state.appMode === "live"
      ? state.relationships.filter((r) => !r.isDemo)
      : state.relationships;
  },

  getClients(): ClientAccount[] {
    const state = ensureDataFile();
    return state.appMode === "live"
      ? state.clients.filter((c) => !c.isDemo)
      : state.clients;
  },

  getCompanies(): Company[] {
    const state = ensureDataFile();
    return state.appMode === "live"
      ? state.companies.filter((c) => !c.isDemo)
      : state.companies;
  },

  getContacts(): Contact[] {
    const state = ensureDataFile();
    return state.appMode === "live"
      ? state.contacts.filter((c) => !c.isDemo)
      : state.contacts;
  },

  getDailyWorkItems(): DailyWorkItem[] {
    const state = ensureDataFile();
    if (state.appMode === "live") {
      const liveOpps = state.opportunities.filter((o) => !o.isDemo);
      const activeBuyersCount = liveOpps.filter((o) => o.acquisitionEngine === "active_demand").length;
      const agencyOverflowCount = liveOpps.filter((o) => o.acquisitionEngine === "agency_overflow").length;
      const inHouseCapacityCount = liveOpps.filter((o) => o.acquisitionEngine === "capacity_overflow").length;
      const rfpCount = liveOpps.filter((o) => o.acquisitionEngine === "private_rfp").length;
      const tendersCount = state.tenders.filter((t) => !t.isDemo).length;

      return [
        {
          engine: "active_demand",
          title: "Active Buyers (<1h / Today)",
          count: activeBuyersCount,
          completedCount: liveOpps.filter((o) => o.acquisitionEngine === "active_demand" && (o.pipelineStage === "contacted" || o.pipelineStage === "replied")).length,
          estimatedMinutes: 45,
          actionLabel: "Review & Dispatch",
        },
        {
          engine: "agency_overflow",
          title: "Agency & Studio Overflow",
          count: agencyOverflowCount,
          completedCount: liveOpps.filter((o) => o.acquisitionEngine === "agency_overflow" && (o.pipelineStage === "contacted" || o.pipelineStage === "replied")).length,
          estimatedMinutes: 30,
          actionLabel: "Send Partner Intro",
        },
        {
          engine: "capacity_overflow",
          title: "In-House Capacity Gaps",
          count: inHouseCapacityCount,
          completedCount: liveOpps.filter((o) => o.acquisitionEngine === "capacity_overflow" && (o.pipelineStage === "contacted" || o.pipelineStage === "replied")).length,
          estimatedMinutes: 30,
          actionLabel: "Send Director Angle",
        },
        {
          engine: "private_rfp",
          title: "Commissions & Private RFPs",
          count: rfpCount,
          completedCount: liveOpps.filter((o) => o.acquisitionEngine === "private_rfp" && (o.pipelineStage === "contacted" || o.pipelineStage === "replied")).length,
          estimatedMinutes: 20,
          actionLabel: "Download & Scope",
        },
        {
          engine: "public_tenders",
          title: "Public Sector Tenders",
          count: tendersCount,
          completedCount: 0,
          estimatedMinutes: 15,
          actionLabel: "Evaluate Fit",
        },
      ];
    }
    return state.dailyWorkItems || initialDailyWorkItems;
  },

  getFocusTasks(): FocusTask[] {
    const state = ensureDataFile();
    if (state.appMode === "live") {
      const liveOpps = state.opportunities
        .filter(
          (o) =>
            !o.isDemo &&
            o.pipelineStage !== "rejected" &&
            o.pipelineStage !== "won" &&
            o.pipelineStage !== "lost" &&
            o.opportunityConfidence !== "signal_only" &&
            o.isElevatedToOpportunity !== false
        )
        .sort((a, b) => b.actionScore - a.actionScore)
        .slice(0, 4);

      if (liveOpps.length > 0) {
        return liveOpps.map((opp) => {
          const comp = state.companies.find((c) => c.id === opp.companyId);
          const cont = state.contacts.find((c) => c.id === opp.primaryContactId);
          return {
            id: `task-${opp.id}`,
            opportunityId: opp.id,
            companyName: comp?.name || opp.company?.name || "Verified Prospect",
            opportunityTitle: opp.title,
            buyerName: cont?.name || opp.primaryContact?.name || "Creative Lead",
            buyerTitle: cont?.jobTitle || opp.primaryContact?.jobTitle || "Hiring Decision Maker",
            engine: opp.acquisitionEngine,
            actionScore: opp.actionScore,
            estimatedMinutes: opp.triggerFreshnessHours <= 2 ? 15 : 20,
            whyNow: opp.triggerFreshnessHours <= 2
              ? `High intent signal (<${Math.round(opp.triggerFreshnessHours * 60)}m ago) — speed is critical.`
              : "Active verified buyer request matching studio capabilities.",
            suggestedAction: opp.recommendedAction,
            completed: opp.pipelineStage === "contacted" || opp.pipelineStage === "replied",
          };
        });
      }
    }
    return state.focusTasks || initialFocusTasks;
  },

  completeFocusTask(taskId: string): FocusTask[] {
    const state = ensureDataFile();
    state.focusTasks = state.focusTasks.map((t) =>
      t.id === taskId ? { ...t, completed: true } : t
    );
    saveState(state);
    return state.focusTasks;
  },

  getAnalytics(): CommercialAnalytics {
    const state = ensureDataFile();
    if (state.appMode === "live") {
      const liveOpps = state.opportunities.filter((o) => !o.isDemo);
      const activeOpps = liveOpps.filter(
        (o) => o.pipelineStage !== "won" && o.pipelineStage !== "lost" && o.pipelineStage !== "rejected"
      );
      const pipelineVal = activeOpps.reduce((sum, o) => sum + (o.estimatedValueGbp || 0), 0);
      const wonOpps = liveOpps.filter((o) => o.pipelineStage === "won");
      const revenueWon = wonOpps.reduce((sum, o) => sum + (o.estimatedValueGbp || 0), 0);

      return {
        revenueWonGbp: revenueWon,
        cashCollectedGbp: Math.round(revenueWon * 0.5),
        weightedPipelineGbp: Math.round(pipelineVal * 0.35),
        averageProjectValueGbp: wonOpps.length > 0 ? Math.round(revenueWon / wonOpps.length) : 0,
        estimatedGrossMarginPercent: 80,
        targetAnnualRevenueGbp: 100000,
        capital: {
          startingBudgetGbp: 5000,
          totalSpentGbp: 140,
          committedGbp: 0,
          remainingGbp: 4860,
          attributedRevenueGbp: revenueWon,
          costBreakdown: {
            ai: 18.42,
            dataEnrichment: 45.0,
            salesTools: 35.0,
            hosting: 24.0,
            email: 17.58,
          },
        },
        conversionByTrigger: [],
      };
    }
    return state.analytics;
  },
};
