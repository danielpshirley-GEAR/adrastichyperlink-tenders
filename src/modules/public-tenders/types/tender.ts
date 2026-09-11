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
  description?: string;
  evaluationCriteria?: Array<{ criterion: string; weightingPercentage: number }>;
  geminiAnalysis?: any;
  requirements?: TenderRequirement[];
  documents?: TenderDocumentItem[];
}

export interface TenderRequirement {
  id: string;
  tenderId: string;
  category: 'insurance' | 'experience' | 'certification' | 'turnover' | 'security' | 'other';
  requirementName: string;
  buyerRequirementText: string;
  sourceCitation: string;
  adrasticCapabilityText?: string;
  status: 'PASS' | 'ACTION_REQUIRED' | 'PARTNER_REQUIRED' | 'FAIL' | 'UNKNOWN';
  mandatory: boolean;
}

export interface TenderDocumentItem {
  id: string;
  fileName: string;
  docType: 'itt' | 'specification' | 'sq' | 'pricing' | 'social_value' | 'clarifications' | 'terms';
  fileSizeBytes?: number;
  fileHash: string;
  requiresLogin: boolean;
  versionNumber: number;
  analysisStatus: 'pending' | 'analyzed' | 'failed';
  lastCheckedAt: string;
}
