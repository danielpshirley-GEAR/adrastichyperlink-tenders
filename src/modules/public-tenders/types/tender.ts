// src/modules/public-tenders/types/tender.ts

export type Qualification = 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
export type VerificationGrade = 'A' | 'B' | 'C' | 'D' | 'X';
export type BidDecisionType = 'BID' | 'PASS' | 'PARTNER' | 'WATCH';
export type BidEffort = 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'VERY_HEAVY';
export type EligibilityStatus = 'PASS' | 'PASS_WITH_ACTION' | 'PARTNER_REQUIRED' | 'UNKNOWN' | 'FAIL';

export type ServiceTaxonomy =
  | 'motion'
  | 'animation_2d'
  | 'animation_3d'
  | 'video'
  | 'film'
  | 'editing'
  | 'graphic_design'
  | 'branding'
  | 'brand_strategy'
  | 'visual_identity'
  | 'information_design'
  | 'creative_strategy'
  | 'campaign'
  | 'advertising'
  | 'marketing'
  | 'internal_communications'
  | 'change_communications'
  | 'public_information'
  | 'training'
  | 'learning_content'
  | 'website'
  | 'ux_ui'
  | 'digital_design'
  | 'interactive'
  | 'presentation_design'
  | 'events_experiential';

export interface TenderSummary {
  id: string;
  canonicalReference: string;
  latestNoticeId?: string;
  ocid?: string;
  title: string | null;
  plainEnglishSummary: string | null;
  buyerName: string | null;
  buyerId?: string | null;
  buyerType?: string;
  valueAmount?: number;
  valueCurrency?: string | null;
  valueDescription?: string;
  publishedAt?: string | null;
  submissionDeadline?: string | null;
  clarificationDeadline?: string | null;
  daysRemaining?: number | null;
  qualification: Qualification;
  deterministicResult?: Qualification;
  aiResult?: Qualification | 'NOT_RUN' | 'UNAVAILABLE' | 'FAILED';
  aiReviewStatus?: 'COMPLETED' | 'REQUIRED' | 'SKIPPED' | string;
  primaryPurpose?: string;
  recommendation?: string;
  finalQualification?: Qualification;
  lifecycleStatus?: 'ACTIVE' | 'EXPIRED' | 'AWARDED' | 'WITHDRAWN' | 'REJECTED';
  verificationGrade: VerificationGrade;
  officialNoticeUrl: string;
  applicationPortalUrl?: string;
  serviceTags: ServiceTaxonomy[];
  sourceId: string;
  source?: string;
  isArchived: boolean;
  archivedReason?: 'RULE_RECLASSIFIED' | 'AI_REJECTED' | 'EXPIRED' | 'MANUAL' | string | null;
  discoveredAt: string;
  lastVerifiedAt: string;
  bidDecisionState?: BidDecisionType | 'UNDECIDED';
  procurementStage?: ProcurementStage;
  description?: string;
  evaluationCriteria?: Array<{ criterion: string; weightingPercentage?: number | null; description?: string; isPublished?: boolean }>;
  geminiAnalysis?: any;
  requirements?: TenderRequirement[];
  documents?: TenderDocumentItem[];
  enrichment?: TenderEnrichment;
  completeness?: InformationCompleteness;
  criticalFlags?: string[];
  keyDeliverables?: string[];
  isEligibilityPublished?: boolean;
  eligibilityNoticeText?: string;
  identityConflict?: boolean;
  identityConflictDetails?: string;
}

export type ProcurementStage =
  | 'OPEN TENDER'
  | 'PLANNED PROCUREMENT'
  | 'PIPELINE'
  | 'PRELIMINARY MARKET ENGAGEMENT'
  | 'FRAMEWORK'
  | 'DYNAMIC MARKET'
  | 'AWARD'
  | 'OTHER';

export type DocumentAccessState =
  | 'PUBLIC'
  | 'LOGIN REQUIRED'
  | 'NOT PUBLISHED'
  | 'ACCESS NOT YET VERIFIED'
  | 'BROKEN';

export type FactType =
  | 'EXPLICIT_BUYER_FACT'
  | 'DOCUMENT_EXTRACTED_FACT'
  | 'PORTAL_FACT'
  | 'AI_INTERPRETATION'
  | 'SYSTEM_STATUS'
  | 'DERIVED_ABSENCE'
  | 'UNKNOWN';

export type EvidenceConfidence =
  | 'VERIFIED'
  | 'HIGH'
  | 'ESTIMATED'
  | 'MEDIUM'
  | 'LOW'
  | 'UNVERIFIED';

export type DocumentItemCategory =
  | 'SOURCE_NOTICE'
  | 'PORTAL_LINK'
  | 'PUBLISHED_DOCUMENT'
  | 'EXPECTED_FUTURE_DOCUMENT';

export interface DocumentCounts {
  sourceNotices: number;
  portalLinks: number;
  publishedDocuments: number;
  expectedFutureDocuments: number;
}

export interface TenderRequirement {
  id: string;
  tenderId: string;
  category: 'insurance' | 'experience' | 'certification' | 'turnover' | 'security' | 'financial' | 'social_value' | 'governance' | 'other';
  requirementName: string;
  buyerRequirementText: string;
  sourceCitation: string;
  factType?: FactType;
  sourceUrl?: string;
  evidenceText?: string;
  adrasticCapabilityText?: string;
  status: 'PASS' | 'PASS_WITH_ACTION' | 'ACTION_REQUIRED' | 'PARTNER_REQUIRED' | 'FAIL' | 'UNKNOWN';
  mandatory: boolean;
}

export interface TenderDocumentItem {
  id: string;
  fileName: string;
  docType: 'itt' | 'specification' | 'sq' | 'pricing' | 'social_value' | 'clarifications' | 'terms' | 'official_notice' | 'buyer_portal' | 'form' | 'other' | string;
  category?: DocumentItemCategory;
  fileSizeBytes?: number;
  fileHash: string | null; // Genuine SHA-256 of downloaded bytes OR null. Never placeholder strings.
  sourceUrl?: string;
  downloadUrl?: string;
  accessState?: DocumentAccessState;
  requiresLogin: boolean;
  versionNumber: number;
  analysisStatus: 'pending' | 'analyzed' | 'failed' | 'not_applicable';
  lastCheckedAt: string;
  notes?: string;
}

export interface EnrichedEvaluationCriterion {
  id: string;
  criterion: string;
  weightingPercentage?: number | null;
  description?: string;
  isPublished: boolean;
  factType?: FactType;
}

export interface CreativeOpportunity {
  opportunity: string;
  rationale: string;
  label: 'AI OPPORTUNITY INTERPRETATION — NOT YET A PUBLISHED REQUIREMENT';
  relevantCoreScope?: string;
}

export interface ScopeAndSpecification {
  whatBuyerWants: string; // Stated by buyer
  businessObjective: string; // Stated by buyer
  requiredServices: string[]; // Backward compat alias for buyerRequiredServices
  buyerRequiredServices: string[]; // Explicit scope points stated in notice
  keyDeliverables: string[]; // Backward compat alias for buyerKeyDeliverables
  buyerKeyDeliverables: string[]; // Only deliverables explicitly specified by buyer (empty if unstated)
  creativeOpportunities: CreativeOpportunity[]; // AI interpretations - clearly distinguished
  targetAudience: string;
  contractScope: string;
  locations: string[];
  duration: string;
  importantDates: Array<{ label: string; date: string; description?: string; factType?: FactType }>;
  creativeMarketingDigitalOverlap: string[]; // Legacy alias
  servicesOutsideCoreCapability: string[];
  isDetailedScopePublished: boolean;
  scopeNoticeText?: string;
  isEligibilityPublished?: boolean;
  eligibilityNoticeText?: string;
}

export interface MarketEngagementFormStatus {
  isReferenced: boolean;
  statusText: string;
  formTitle?: string;
  formType?: string;
  sourceEvidenceText?: string;
  sourceUrl?: string | null;
  portalUrl?: string;
  accessState: DocumentAccessState;
  deadline?: string | null;
  deadlineText?: string | null;
  deadlineSource?: string | null;
  instructions?: string;
}

export interface SubmissionAndEngagementDetails {
  procurementStage: ProcurementStage;
  submissionRoute: string;
  submissionPortalUrl?: string | null;
  deadline?: string | null;
  clarificationDeadline?: string | null;
  buyerContact: {
    name?: string;
    email?: string;
    telephone?: string;
    address?: string;
  };
  requiredAttachments: string[];
  participationInstructions: string;
  isOpenForBid: boolean;
  isMarketEngagement: boolean;
  marketEngagementForm?: MarketEngagementFormStatus;
}

export interface FitAndRisksAssessment {
  whyAdrastichyperlinkFits: string;
  whyItMayNotFit: string;
  riskFactors: string[];
  partneringRecommendation: string;
}

export interface SourceEvidenceItem {
  id: string;
  topic: string;
  fact: string;
  factType: FactType;
  value?: string | number | null;
  source: string;
  sourceType: 'OFFICIAL_OCDS_NOTICE' | 'DOCUMENT' | 'PORTAL' | 'BUYER_COMMUNICATION' | 'UNKNOWN';
  sourceUrl?: string;
  sourceDocumentId?: string;
  page?: number | null;
  section?: string;
  evidenceText?: string;
  confidence: EvidenceConfidence;
  isVerified: boolean;
}

export type ProvenanceSourceType =
  | 'CONTRACTS_FINDER_OCDS'
  | 'CONTRACTS_FINDER_NOTICE_PAGE'
  | 'FIND_A_TENDER_OCDS'
  | 'FIND_A_TENDER_NOTICE_PAGE'
  | 'BUYER_PORTAL'
  | 'TENDER_DOCUMENT'
  | 'AI_INTERPRETATION'
  | 'DERIVED_ABSENCE'
  | 'UNKNOWN';

export type FactStatus =
  | 'FOUND'
  | 'PARTIAL'
  | 'NOT_FOUND'
  | 'NOT_YET_RETRIEVED'
  | 'REGISTRATION_REQUIRED'
  | 'LOGIN_REQUIRED'
  | 'BROKEN';

export interface ProvenancedFact<T = any> {
  value: T;
  factType: FactType;
  sourceType: ProvenanceSourceType;
  sourceUrl?: string | null;
  sourceDocument?: string | null;
  sourceLocation?: string | null;
  extractedAt: string;
  confidence: EvidenceConfidence;
  status: FactStatus;
  notes?: string;
}

export interface InformationCompleteness {
  score: number; // Found core fields
  total: number; // Total core dimensions (e.g. 20)
  percentage: number;
  status: 'COMPLETE' | 'PARTIAL' | 'MINIMAL';
  fields: Record<
    string,
    {
      label: string;
      status: 'FOUND' | 'PARTIAL' | 'NOT_FOUND' | 'REGISTRATION_REQUIRED';
      valueSummary?: string;
    }
  >;
}

export interface TenderFactModel {
  identity: {
    title: ProvenancedFact<string>;
    noticeId: ProvenancedFact<string>;
    releaseId?: ProvenancedFact<string>;
    ocid?: ProvenancedFact<string>;
    buyerReference?: ProvenancedFact<string>;
    procurementReference?: ProvenancedFact<string>;
    source: ProvenancedFact<string>;
  };
  buyer: {
    organisation: ProvenancedFact<string>;
    buyerType: ProvenancedFact<string>;
    department?: ProvenancedFact<string>;
    address?: ProvenancedFact<string>;
    region?: ProvenancedFact<string>;
    contactName?: ProvenancedFact<string>;
    contactRole?: ProvenancedFact<string>;
    email?: ProvenancedFact<string>;
    telephone?: ProvenancedFact<string>;
    website?: ProvenancedFact<string>;
  };
  procurement: {
    stage: ProvenancedFact<ProcurementStage>;
    procedure: ProvenancedFact<string>;
    procurementMethod?: ProvenancedFact<string>;
    frameworkStatus?: ProvenancedFact<string>;
    dynamicMarketStatus?: ProvenancedFact<string>;
    lots?: ProvenancedFact<Array<{ lotId: string; title: string; value?: number; description?: string }>>;
    smeSuitable: ProvenancedFact<boolean | null>;
    vcseSuitable: ProvenancedFact<boolean | null>;
    cpvCodes: ProvenancedFact<string[]>;
  };
  money: {
    estimatedValue?: ProvenancedFact<number | null>;
    minValue?: ProvenancedFact<number | null>;
    maxValue?: ProvenancedFact<number | null>;
    currency: ProvenancedFact<string>;
    valueDescription?: ProvenancedFact<string>;
    vatTreatment?: ProvenancedFact<string>;
    pricingModel?: ProvenancedFact<string>;
  };
  dates: {
    publication?: ProvenancedFact<string | null>;
    lastUpdate?: ProvenancedFact<string | null>;
    clarificationDeadline?: ProvenancedFact<string | null>;
    submissionDeadline?: ProvenancedFact<string | null>;
    contractStart?: ProvenancedFact<string | null>;
    contractEnd?: ProvenancedFact<string | null>;
    duration?: ProvenancedFact<string | null>;
  };
  scope: {
    buyerProblem?: ProvenancedFact<string>;
    objectives?: ProvenancedFact<string>;
    exactDeliverables: ProvenancedFact<string[]>;
    requiredOutputs?: ProvenancedFact<string[]>;
    formats?: ProvenancedFact<string[]>;
    channels?: ProvenancedFact<string[]>;
    audiences?: ProvenancedFact<string>;
    workingModel?: ProvenancedFact<string>;
  };
  creativeRequirements?: {
    branding?: ProvenancedFact<boolean>;
    brandStrategy?: ProvenancedFact<boolean>;
    visualIdentity?: ProvenancedFact<boolean>;
    graphicDesign?: ProvenancedFact<boolean>;
    campaignCreative?: ProvenancedFact<boolean>;
    motionDesign?: ProvenancedFact<boolean>;
    animation?: ProvenancedFact<boolean>;
    video?: ProvenancedFact<boolean>;
    filming?: ProvenancedFact<boolean>;
    editing?: ProvenancedFact<boolean>;
    website?: ProvenancedFact<boolean>;
    uxUi?: ProvenancedFact<boolean>;
    events?: ProvenancedFact<boolean>;
  };
  eligibility: {
    mandatoryRequirements: ProvenancedFact<string[]>;
    passFailConditions: ProvenancedFact<string[]>;
    turnoverRequirement?: ProvenancedFact<string>;
    insurancePI?: ProvenancedFact<string>;
    insurancePL?: ProvenancedFact<string>;
    insuranceEL?: ProvenancedFact<string>;
    certifications?: ProvenancedFact<string[]>;
    securityRequirements?: ProvenancedFact<string>;
  };
  experienceRequirements: {
    previousContracts?: ProvenancedFact<string>;
    caseStudiesRequired?: ProvenancedFact<string>;
    referencesRequired?: ProvenancedFact<string>;
    sectorExperience?: ProvenancedFact<string>;
  };
  evaluation: {
    qualityWeighting?: ProvenancedFact<number | null>;
    priceWeighting?: ProvenancedFact<number | null>;
    socialValueWeighting?: ProvenancedFact<number | null>;
    interviewWeighting?: ProvenancedFact<number | null>;
    criteria: ProvenancedFact<Array<{ criterion: string; weighting?: number | null; description?: string }>>;
    scoringMethodology?: ProvenancedFact<string>;
  };
  submission: {
    portal?: ProvenancedFact<string>;
    exactSubmissionUrl?: ProvenancedFact<string>;
    registrationRequirement: ProvenancedFact<string>;
    accessState: ProvenancedFact<DocumentAccessState>;
    responseFormat?: ProvenancedFact<string>;
    wordLimits?: ProvenancedFact<string>;
    attachmentsRequired?: ProvenancedFact<string[]>;
    deadline?: ProvenancedFact<string | null>;
  };
  contract: {
    duration?: ProvenancedFact<string>;
    extensions?: ProvenancedFact<string>;
    paymentTerms?: ProvenancedFact<string>;
    kpis?: ProvenancedFact<string>;
    intellectualProperty?: ProvenancedFact<string>;
  };
  other: {
    incumbent?: ProvenancedFact<string>;
    siteVisits?: ProvenancedFact<string>;
    bidderEvents?: ProvenancedFact<string>;
    amendments?: ProvenancedFact<string[]>;
  };
}

export interface TenderEnrichment {
  tenderId: string;
  canonicalReference: string;
  enrichedAt: string;
  procurementStage: ProcurementStage;
  scopeAndSpec: ScopeAndSpecification;
  documents: TenderDocumentItem[];
  documentCounts?: DocumentCounts;
  requirements: TenderRequirement[];
  isEligibilityPublished?: boolean;
  eligibilityNoticeText?: string;
  evaluationCriteria: EnrichedEvaluationCriterion[];
  submissionDetails: SubmissionAndEngagementDetails;
  fitAndRisks: FitAndRisksAssessment;
  sourceEvidence: SourceEvidenceItem[];
  factModel?: TenderFactModel;
  completeness?: InformationCompleteness;
  criticalFlags?: string[];
}


