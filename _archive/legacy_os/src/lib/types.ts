export type AcquisitionEngine =
  | "active_demand"          // 1. Active Buyers (Explicit search, <1h)
  | "triggered_businesses"   // 2. Business Signals (Growth, funding, leadership)
  | "internal_needs"         // 3. Internal Business Needs (Transformation, comms, L&D)
  | "capacity_overflow"      // 4. In-House Capacity (Marketing vs design deficit)
  | "agency_overflow"        // 5. Agency & Studio Overflow (Account wins, white-label)
  | "private_rfp"            // 6. Commissions & Private RFPs
  | "public_tenders"         // 7. Public Tenders (Tender evaluation)
  | "frameworks"             // 8. Frameworks & Supplier Routes
  | "recruiters_freelance"   // 9. Recruiters & Freelance (Cash flow)
  | "multipliers_introducers"// 10. Partners & Multipliers (VC, PE, fractional CMO)
  | "inbound_authority"      // 11. Inbound & Authority (Website, SEO, articles)
  | "client_expansion";      // 12. Client Expansion (Repeat scope, retainers)

export type EngagementType =
  | "production_commission" // £1k–£5k
  | "studio_project"         // £5k–£15k
  | "transformation_project" // £10k–£25k+
  | "creative_partnership"   // £2.5k–£5k/mo retainer
  | "major_contract";        // £25k–£250k+

export type PipelineStage =
  | "discovered"
  | "researched"
  | "qualified"
  | "contact_ready"
  | "contacted"
  | "replied"
  | "meeting_booked"
  | "discovery"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost"
  | "nurture"
  | "rejected";

export type BrandRoute = "adrastichyperlink" | "danielpshirley" | "daniel_freelance";
export type AppMode = "demo" | "live";
export type LeadFeedback =
  | "excellent"
  | "relevant"
  | "weak"
  | "wrong"
  | "no_budget"
  | "wrong_buyer"
  | "too_old"
  | "not_our_work";

export type SignalClassification =
  | "explicit_external_buyer"
  | "freelance_contractor_vacancy"
  | "permanent_employment_vacancy"
  | "agency_capacity_signal"
  | "in_house_capacity_signal"
  | "internal_business_need"
  | "private_rfp"
  | "public_tender"
  | "framework"
  | "business_trigger"
  | "partner_multiplier_signal"
  | "irrelevant";

export type OpportunityConfidence =
  | "confirmed_external_demand"
  | "strong_external_opportunity"
  | "possible_opportunity"
  | "signal_only";

export type ConfidenceLevel = "verified" | "likely" | "inferred" | "unknown";
export type BudgetEvidenceConfidence =
  | "confirmed"
  | "employment_spend"
  | "strongly_inferred"
  | "weakly_inferred"
  | "unknown";
export type TenderStatus = "bid" | "review" | "reject";

export interface SignalStackItem {
  id: string;
  type: "funding" | "expansion" | "leadership" | "hiring" | "m_and_a" | "active_request";
  headline: string;
  date: string;
  sourceUrl?: string;
  confidence: ConfidenceLevel;
}

export interface EvidenceItem {
  id: string;
  sourceUrl: string;
  title: string;
  excerpt: string;
  confidence: ConfidenceLevel;
  date: string;
  category: "funding" | "hiring" | "leadership" | "expansion" | "rfp" | "post" | "news";
}

export interface Contact {
  id: string;
  name: string;
  jobTitle: string;
  companyId: string;
  linkedinUrl?: string;
  email?: string;
  phone?: string;
  roleCategory: "c_level" | "vp_director" | "head_of" | "manager" | "consultant" | "procurement";
  estimatedDecisionInfluence: "high" | "medium" | "low";
  verificationStatus: "verified" | "likely" | "unverified";
  lastContactedAt?: string;
  suppressed?: boolean;
  notes?: string;
  isDemo?: boolean;
}

export interface Company {
  id: string;
  name: string;
  website: string;
  linkedinUrl?: string;
  industry: string;
  companyType: "scaleup" | "enterprise" | "agency" | "public_sector" | "smb" | "investment";
  location: string;
  employeeCount: number;
  estimatedAnnualRevenueGbp?: string;
  knownFundingGbp?: string;
  marketingTeamSize: number;
  creativeTeamSize: number;
  creativeMaturityRating: "low" | "medium" | "high" | "lagging_behind_growth";
  creativeMaturitySummary: string;
  existingAgencies?: string[];
  advertisingEvidence?: string;
  summary: string;
  qualificationStatus: "qualified" | "nurture" | "rejected" | "under_review";
  rejectionReason?: string;
  lastResearchedAt: string;
  signalStack?: SignalStackItem[];
  isDemo?: boolean;
}

export interface Opportunity {
  id: string;
  companyId: string;
  company?: Company;
  primaryContactId?: string;
  primaryContact?: Contact;
  title: string;
  acquisitionEngine: AcquisitionEngine;
  sourceDescription: string;
  trigger: string;
  triggerDate: string; // ISO string
  triggerFreshnessHours: number;
  needDescription: string;
  relevantCapabilities: ("strategy" | "motion" | "brand" | "digital")[];
  evidence: EvidenceItem[];
  
  // Strict Evidence Model & Classification
  signalClassification?: SignalClassification;
  opportunityConfidence?: OpportunityConfidence;
  isExternalDemandConfirmed?: boolean;
  isElevatedToOpportunity?: boolean;
  whatEvidenceActuallyProves?: string;
  employmentSpendGbp?: string; // Stored separately, never confused with project value
  publishedAt?: string; // Real publication timestamp on source
  applicationDeadline?: string; // Stated deadline on primary source
  discoveredAt?: string; // Sourcing crawler discovery timestamp
  lastVerifiedAt?: string; // Verification timestamp
  sourceGrade?: "A" | "B" | "C" | "D";
  verificationStatus?: "verified" | "likely" | "unverified" | "rejected";
  verificationNotes?: string;
  
  // Dual Scoring Model
  leadScore: number; // 0–100 overall quality
  actionScore: number; // 0–100 urgency today
  
  intentScore: number; // 0–30
  budgetScore: number; // 0–25
  budgetConfidence: BudgetEvidenceConfidence;
  timingScore: number; // 0–15
  fitScore: number; // 0–15
  buyerAccessScore: number; // 0–10
  strategicValueScore: number; // 0–5
  
  estimatedValueRange: string;
  estimatedValueGbp: number;
  recommendedEngagement: EngagementType;
  recommendedAction: string;
  brandRoute: BrandRoute;
  
  pipelineStage: PipelineStage;
  nextAction: string;
  nextActionDeadline: string;
  winProbabilityPercent: number;
  isDemo?: boolean;
  
  matchedProof: {
    workTitle: string;
    isRealClientWork: boolean;
    relevanceRationale: string;
  }[];
  
  outreachDrafts?: {
    emailSubject: string;
    emailBody: string;
    linkedinMessage: string;
    callAngle: {
      whyThisPerson: string;
      whyNow: string;
      openingLine: string;
      talkingPoints: string[];
      likelyObjection: string;
    };
    videoPitchOutline?: {
      targetDurationSeconds: number;
      hook: string;
      observation: string;
      relevantWorkReference: string;
      callToAction: string;
    };
  };

  meetingBrief?: {
    companySummary: string;
    triggerContext: string;
    buyerRoleContext: string;
    diagnosticQuestions: string[];
    potentialScopeBoundaries: string;
    commercialRisks: string[];
    desiredNextStep: string;
  };

  proposalBrief?: {
    whatWeLearned: string;
    theProblem: string;
    desiredOutcome: string;
    recommendedCreativeApproach: string;
    singleRecommendedSolution: {
      title: string;
      deliverables: string[];
      timelineWeeks: number;
      investmentGbp: number;
      paymentStructure: string;
    };
    optionalReducedScope?: {
      title: string;
      deliverables: string[];
      investmentGbp: number;
    };
    optionalExpandedScope?: {
      title: string;
      deliverables: string[];
      investmentGbp: number;
    };
  };
  
  feedback?: LeadFeedback;
  feedbackAt?: string;
  followUpSchedule?: string;
  isUrgent: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierReadinessCheck {
  id: string;
  label: string;
  category: "legal" | "financial" | "technical" | "compliance" | "evidence";
  passed: boolean;
  details: string;
  requiredForPrime: boolean;
}

export interface ProcurementTender {
  id: string;
  title: string;
  buyerName: string;
  buyerType: "central_gov" | "council" | "nhs" | "higher_ed" | "corporate" | "framework";
  estimatedValueGbp: number;
  valueDisplay: string;
  submissionDeadline: string;
  publishedAt: string;
  capabilityFitScore: number;
  bidScore: number;
  bidRecommendation: TenderStatus;
  recommendationRationale: string;
  mandatoryRequirements: string[];
  missingOrRiskyRequirements: string[];
  insuranceRequired: string;
  turnoverRequired?: string;
  subcontractingOpportunity: boolean;
  portalUrl: string;
  notes?: string;
  isDemo?: boolean;
}

export interface FrameworkItem {
  id: string;
  title: string;
  issuerName: string;
  category: "central_gov" | "local_council" | "higher_ed" | "corporate_panel";
  status: "open_now" | "opening_soon" | "approved_supplier" | "closed";
  openingDate: string;
  closingDate: string;
  eligibility: string;
  typicalContractValues: string;
  requiredEvidence: string[];
  preparationState: string;
  readinessScorePercent: number;
  portalUrl: string;
  isDemo?: boolean;
}

export interface RelationshipPartner {
  id: string;
  name: string;
  contactName: string;
  role: string;
  partnerType:
    | "vc_pe"
    | "fractional_cmo"
    | "agency"
    | "recruiter"
    | "consultant"
    | "developer"
    | "m_and_a";
  relationshipStrength: "tier_1_active" | "tier_2_warm" | "tier_3_initial";
  companiesRepresentedCount: number;
  introductionsCount: number;
  attributedRevenueGbp: number;
  commissionAgreement?: string;
  lastContactedAt: string;
  nextAction: string;
  nextActionDeadline: string;
  notes: string;
  isDemo?: boolean;
}

export interface ClientAccount {
  id: string;
  companyName: string;
  primaryContactName: string;
  activeProjectsCount: number;
  totalRevenueWonGbp: number;
  cashCollectedGbp: number;
  paymentStatus: "up_to_date" | "deposit_paid" | "overdue";
  nextOpportunityIdentified?: string;
  retainerPotential: "immediate_candidate" | "in_conversation" | "project_only" | "active_retainer";
  testimonialStatus: "published" | "requested" | "eligible" | "not_yet";
  caseStudyStatus: "published" | "permission_granted" | "requested" | "not_yet";
  referralStatus: "received" | "requested" | "eligible";
  relationshipHealth: "thriving" | "good" | "needs_attention";
  lastCheckInAt: string;
  nextCheckInAt: string;
  isDemo?: boolean;
}

export interface FocusTask {
  id: string;
  opportunityId: string;
  companyName: string;
  opportunityTitle: string;
  buyerName: string;
  buyerTitle: string;
  engine: AcquisitionEngine;
  actionScore: number;
  estimatedMinutes: number;
  whyNow: string;
  suggestedAction: string;
  completed: boolean;
}

export interface DailyWorkItem {
  engine: AcquisitionEngine;
  title: string;
  count: number;
  completedCount: number;
  estimatedMinutes: number;
  actionLabel: string;
}

export interface GrowthCapitalMetrics {
  startingBudgetGbp: number; // 5000
  totalSpentGbp: number;
  committedGbp: number;
  remainingGbp: number;
  attributedRevenueGbp: number;
  costBreakdown: {
    ai: number;
    dataEnrichment: number;
    salesTools: number;
    hosting: number;
    email: number;
  };
}

export interface CommercialAnalytics {
  revenueWonGbp: number;
  cashCollectedGbp: number;
  weightedPipelineGbp: number;
  averageProjectValueGbp: number;
  estimatedGrossMarginPercent: number;
  targetAnnualRevenueGbp: number;
  capital: GrowthCapitalMetrics;
  conversionByTrigger: {
    trigger: string;
    leadsCount: number;
    winsCount: number;
    conversionRatePercent: number;
  }[];
}
