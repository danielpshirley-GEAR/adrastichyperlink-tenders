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
  isEligibilityPublished?: boolean;
  eligibilityNoticeText?: string;
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
  | 'UNKNOWN';

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
  portalUrl?: string;
  accessState: DocumentAccessState;
  deadlineText?: string | null;
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
  confidence: 'VERIFIED' | 'HIGH' | 'ESTIMATED' | 'MEDIUM' | 'LOW';
  isVerified: boolean;
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
}

