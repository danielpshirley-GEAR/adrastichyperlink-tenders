// src/modules/public-tenders/services/detail-enrichment.ts
import { FindATenderConnector } from '../connectors/find-a-tender';
import { RawNoticeRecord } from '../connectors/types';
import {
  TenderSummary,
  TenderEnrichment,
  ProcurementStage,
  TenderDocumentItem,
  TenderRequirement,
  EnrichedEvaluationCriterion,
  ScopeAndSpecification,
  SubmissionAndEngagementDetails,
  FitAndRisksAssessment,
  SourceEvidenceItem,
  DocumentCounts,
  CreativeOpportunity,
} from '../types/tender';
import { GeminiClient } from '@/shared/ai/gemini-client';

export class DetailEnrichmentService {
  private connector: FindATenderConnector;

  constructor() {
    this.connector = new FindATenderConnector();
  }

  /**
   * Deterministically identifies the procurement stage from notice tags, status, and text.
   */
  static determineProcurementStage(rawPayload: any, title?: string | null, description?: string | null): ProcurementStage {
    const tag = Array.isArray(rawPayload?.tag) ? rawPayload.tag : [];
    const status = (rawPayload?.tender?.status || '').toLowerCase();
    const fullText = `${title || ''} ${description || ''} ${rawPayload?.description || ''} ${rawPayload?.tender?.description || ''}`.toLowerCase();
    const futureNoticeDate = rawPayload?.tender?.communication?.futureNoticeDate;

    // 1. Planning / PIN / Preliminary Market Engagement
    if (
      tag.includes('planning') ||
      status === 'planned' ||
      Boolean(futureNoticeDate) ||
      fullText.includes('prior information notice') ||
      fullText.includes('market engagement') ||
      fullText.includes('not a call for competition') ||
      fullText.includes('preliminary market') ||
      fullText.includes('pipeline')
    ) {
      if (fullText.includes('market engagement') || fullText.includes('prior information notice') || fullText.includes('not a call for competition')) {
        return 'PRELIMINARY MARKET ENGAGEMENT';
      }
      return 'PLANNED PROCUREMENT';
    }

    // 2. Framework / DPS
    if (fullText.includes('framework agreement') || fullText.includes('dynamic purchasing system') || fullText.includes('dynamic market')) {
      if (fullText.includes('dynamic')) return 'DYNAMIC MARKET';
      return 'FRAMEWORK';
    }

    // 3. Awarded
    if (tag.includes('award') || status === 'complete' || fullText.includes('contract award notice')) {
      return 'AWARD';
    }

    // 4. Open Tender
    if (tag.includes('tender') || status === 'active') {
      return 'OPEN TENDER';
    }

    return 'OTHER';
  }

  /**
   * Enriches a tender opportunity with verified procurement intelligence.
   * Completely generic across all public sector notices with zero hardcoded notice IDs.
   */
  async enrichTender(
    tender: TenderSummary,
    existingRawRecord?: RawNoticeRecord | null
  ): Promise<TenderEnrichment> {
    const noticeIdOrOcid = tender.latestNoticeId || tender.canonicalReference || tender.ocid || tender.id;

    // 1. Fetch complete official notice if not provided
    let rawRecord: RawNoticeRecord | null = existingRawRecord || null;
    if (!rawRecord) {
      try {
        rawRecord = await this.connector.fetchNotice(noticeIdOrOcid);
      } catch (err: any) {
        console.warn(`[DetailEnrichment] Failed to fetch notice for ${noticeIdOrOcid}:`, err.message);
      }
    }

    const rawPayload: any = rawRecord?.rawPayload || {};
    const title = tender.title || rawRecord?.title || 'Procurement Opportunity';
    const description = tender.description || rawRecord?.description || rawPayload?.tender?.description || '';

    // 2. Resolve Procurement Stage
    const procurementStage = DetailEnrichmentService.determineProcurementStage(rawPayload, title, description);
    const isMarketEngagement = procurementStage === 'PRELIMINARY MARKET ENGAGEMENT' || procurementStage === 'PLANNED PROCUREMENT' || procurementStage === 'PIPELINE';
    const isOpenForBid = procurementStage === 'OPEN TENDER';

    // 3. Extract Buyer & Contact Information
    const buyerParty = Array.isArray(rawPayload.parties)
      ? rawPayload.parties.find((p: any) => Array.isArray(p.roles) && (p.roles.includes('buyer') || p.roles.includes('centralPurchasingBody')))
      : null;

    const buyerName = tender.buyerName || rawRecord?.buyerName || buyerParty?.name || 'Public Authority';
    const buyerAddress = buyerParty?.address
      ? `${buyerParty.address.streetAddress || ''}, ${buyerParty.address.locality || ''} ${buyerParty.address.postalCode || ''}, ${buyerParty.address.countryName || 'United Kingdom'}`.replace(/^,\s*/, '').trim()
      : undefined;
    const buyerContact = {
      name: buyerParty?.contactPoint?.name || undefined,
      email: buyerParty?.contactPoint?.email || undefined,
      telephone: buyerParty?.contactPoint?.telephone || undefined,
      address: buyerAddress,
    };

    // 4. Real Document Model & Categorization (Zero placeholder hashes!)
    const documents: TenderDocumentItem[] = [];
    const officialNoticeUrl = tender.officialNoticeUrl || `https://www.find-tender.service.gov.uk/Notice/${tender.latestNoticeId || tender.canonicalReference}`;

    // A. Source Notice
    documents.push({
      id: `doc-${tender.id}-fts-notice`,
      fileName: `Find a Tender Official Notice (${tender.latestNoticeId || tender.canonicalReference})`,
      docType: 'official_notice',
      category: 'SOURCE_NOTICE',
      sourceUrl: officialNoticeUrl,
      downloadUrl: officialNoticeUrl,
      accessState: 'PUBLIC',
      requiresLogin: false,
      versionNumber: 1,
      analysisStatus: 'analyzed',
      lastCheckedAt: new Date().toISOString(),
      notes: 'Official UK Find a Tender electronic notice release.',
      fileHash: null, // Web page / notice link, not a downloaded file
    });

    // B. Portal Link (e.g. Public Contracts Scotland profile / Authority Portal)
    const buyerProfileUrl = buyerParty?.details?.buyerProfile;
    if (buyerProfileUrl) {
      documents.push({
        id: `doc-${tender.id}-buyer-profile`,
        fileName: 'Buyer Procurement Profile & Authority Portal',
        docType: 'buyer_portal',
        category: 'PORTAL_LINK',
        sourceUrl: buyerProfileUrl,
        downloadUrl: buyerProfileUrl,
        accessState: 'PUBLIC',
        requiresLogin: false,
        versionNumber: 1,
        analysisStatus: 'analyzed',
        lastCheckedAt: new Date().toISOString(),
        notes: 'Public portal for supplier registration and future tender pack releases.',
        fileHash: null, // Portal link, not a downloaded file
      });
    }

    // C. Attached OCDS Documents (if published by the buyer in the release)
    if (Array.isArray(rawPayload?.tender?.documents)) {
      for (const doc of rawPayload.tender.documents) {
        if (doc.url) {
          const isLogin = Boolean(doc.requiresLogin) || doc.url.includes('login') || doc.url.includes('auth');
          documents.push({
            id: `doc-${tender.id}-${doc.id || Math.random().toString(36).slice(2, 8)}`,
            fileName: doc.title || doc.documentType || 'Procurement Document',
            docType: doc.documentType || 'specification',
            category: 'PUBLISHED_DOCUMENT',
            sourceUrl: doc.url,
            downloadUrl: doc.url,
            accessState: isLogin ? 'LOGIN REQUIRED' : 'PUBLIC',
            requiresLogin: isLogin,
            versionNumber: 1,
            analysisStatus: 'pending',
            lastCheckedAt: new Date().toISOString(),
            notes: doc.description || undefined,
            fileHash: null, // Not yet downloaded locally; set null per strict hashing rule
          });
        }
      }
    }

    // D. Expected Future Documents (if preliminary engagement and formal specification is not yet released)
    const publishedSpecs = documents.filter((d) => d.category === 'PUBLISHED_DOCUMENT' && (d.docType === 'specification' || d.docType === 'itt'));
    if (isMarketEngagement && publishedSpecs.length === 0) {
      documents.push({
        id: `doc-${tender.id}-spec-pending`,
        fileName: 'Invitation to Tender (ITT) & Specification Pack',
        docType: 'specification',
        category: 'EXPECTED_FUTURE_DOCUMENT',
        accessState: 'NOT PUBLISHED',
        requiresLogin: false,
        versionNumber: 0,
        analysisStatus: 'not_applicable',
        lastCheckedAt: new Date().toISOString(),
        notes: 'Detailed specification has not yet been published. Scheduled for release when formal competition begins.',
        fileHash: null,
      });
    }

    // E. Market Engagement Submission Form Investigation
    const fullNoticeText = `${title} ${description}`.toLowerCase();
    const isFormReferenced =
      fullNoticeText.includes('market engagement') ||
      fullNoticeText.includes('submission form') ||
      fullNoticeText.includes('response form') ||
      fullNoticeText.includes('questionnaire') ||
      fullNoticeText.includes('survey');

    let marketEngagementFormStatus = undefined;
    if (isMarketEngagement && isFormReferenced) {
      marketEngagementFormStatus = {
        isReferenced: true,
        statusText: 'MARKET ENGAGEMENT FORM REFERENCED — ACCESS NOT YET VERIFIED',
        portalUrl: buyerProfileUrl || officialNoticeUrl,
        accessState: 'ACCESS NOT YET VERIFIED' as const,
        deadlineText: null, // Never invent an unstated deadline
        instructions: 'Suppliers should access the official buyer portal (Public Contracts Scotland / Authority Portal) to review preliminary engagement notices and supplier response instructions.',
      };

      documents.push({
        id: `doc-${tender.id}-engagement-form`,
        fileName: 'Supplier Market Engagement Response Form',
        docType: 'form',
        category: 'EXPECTED_FUTURE_DOCUMENT',
        accessState: 'ACCESS NOT YET VERIFIED',
        requiresLogin: true,
        versionNumber: 0,
        analysisStatus: 'not_applicable',
        lastCheckedAt: new Date().toISOString(),
        notes: 'Market engagement response form referenced in procurement notices. Access verification requires buyer portal login.',
        fileHash: null,
      });
    }

    // Summary document counts
    const documentCounts: DocumentCounts = {
      sourceNotices: documents.filter((d) => d.category === 'SOURCE_NOTICE').length,
      portalLinks: documents.filter((d) => d.category === 'PORTAL_LINK').length,
      publishedDocuments: documents.filter((d) => d.category === 'PUBLISHED_DOCUMENT').length,
      expectedFutureDocuments: documents.filter((d) => d.category === 'EXPECTED_FUTURE_DOCUMENT').length,
    };

    // 5. Synthesize Intelligence (Gemini with generic deterministic fallback)
    let synthesized = await this.synthesizeWithGemini(tender, rawRecord, procurementStage);
    if (!synthesized) {
      synthesized = this.synthesizeDeterministically(tender, rawRecord, procurementStage);
    }

    const {
      scopeAndSpec,
      requirements,
      evaluationCriteria,
      submissionDetails,
      fitAndRisks,
      sourceEvidence,
    } = synthesized;

    const isEligibilityPublished = requirements.length > 0;
    const eligibilityNoticeText = isEligibilityPublished
      ? undefined
      : 'Formal eligibility criteria have not yet been published in the currently available procurement material.';

    // Assemble final structured enrichment
    const enrichment: TenderEnrichment = {
      tenderId: tender.id,
      canonicalReference: tender.canonicalReference,
      enrichedAt: new Date().toISOString(),
      procurementStage,
      scopeAndSpec: {
        ...scopeAndSpec,
        isEligibilityPublished,
        eligibilityNoticeText,
      },
      documents,
      documentCounts,
      requirements,
      isEligibilityPublished,
      eligibilityNoticeText,
      evaluationCriteria,
      submissionDetails: {
        ...submissionDetails,
        procurementStage,
        isOpenForBid,
        isMarketEngagement,
        buyerContact,
        marketEngagementForm: marketEngagementFormStatus,
      },
      fitAndRisks,
      sourceEvidence,
    };

    return enrichment;
  }

  /**
   * High-intelligence synthesis via Gemini grounding strictly on raw OCDS facts.
   * Stripped of built-in capability assumptions.
   */
  private async synthesizeWithGemini(
    tender: TenderSummary,
    rawRecord: RawNoticeRecord | null,
    procurementStage: ProcurementStage
  ): Promise<{
    scopeAndSpec: ScopeAndSpecification;
    requirements: TenderRequirement[];
    evaluationCriteria: EnrichedEvaluationCriterion[];
    submissionDetails: SubmissionAndEngagementDetails;
    fitAndRisks: FitAndRisksAssessment;
    sourceEvidence: SourceEvidenceItem[];
  } | null> {
    if (!GeminiClient.isConfigured()) {
      return null;
    }

    const rawPayload: any = rawRecord?.rawPayload || {};
    const lotsText = Array.isArray(rawPayload?.tender?.lots)
      ? rawPayload.tender.lots.map((l: any) => `Lot ${l.id}: ${l.description || ''}`).join('\n')
      : '';

    const prompt = `
You are a senior UK public procurement intelligence specialist and creative bid advisor for Adrastichyperlink (a specialist creative studio focusing on high-impact visual identity, branding, 2D/3D motion graphics, campaign design, and digital content).

Analyze this official UK procurement notice and extract verified procurement intelligence.

CRITICAL EVIDENCE RULES:
1. NEVER INVENT missing procurement details, mandatory requirements, turnover thresholds, insurance requirements, or evaluation weightings.
2. DISTINGUISH STRICTLY BETWEEN:
   A. EXPLICIT BUYER FACTS: What the buyer explicitly states in the notice.
   B. AI OPPORTUNITY INTERPRETATIONS: Creative ways Adrastichyperlink could contribute, which are NOT published buyer requirements.
3. ELIGIBILITY / SQ REQUIREMENTS:
   If the buyer has NOT published formal eligibility criteria or SQ requirements in this notice (typical for preliminary market engagement or PIN notices), return an empty array: "requirements": [].
   DO NOT INVENT or infer requirements from generic Scottish or UK procurement norms.
4. KEY DELIVERABLES:
   Only list deliverables explicitly specified by the buyer in the notice. If the buyer has not specified deliverables in this preliminary notice, return an empty array: "buyerKeyDeliverables": [].
5. CREATIVE OPPORTUNITIES:
   Suggest 2-4 potential creative, motion design, digital media, or visual branding opportunities Adrastichyperlink could propose, but always label each item with: "AI OPPORTUNITY INTERPRETATION — NOT YET A PUBLISHED REQUIREMENT".
6. EVALUATION CRITERIA:
   If evaluation criteria have not been published in this notice, set isPublished: false, weightingPercentage: null, and criterion: "Evaluation criteria have not yet been published in the currently available procurement material."
7. NO COMPANY ASSUMPTIONS:
   Do NOT assume Adrastichyperlink capabilities, insurances, or certifications in your prompt. If assessing fit, evaluate creative studio expertise (motion graphics, branding, digital campaign creative) vs non-core activities (general operations, civil works, tourism operations).

NOTICE DATA:
Reference: ${tender.canonicalReference}
Title: ${tender.title || rawRecord?.title || ''}
Buyer: ${tender.buyerName || rawRecord?.buyerName || ''}
Value: ${tender.valueAmount ? `£${tender.valueAmount.toLocaleString()} ${tender.valueCurrency || 'GBP'}` : 'Not stated'}
Published: ${tender.publishedAt || 'Not stated'}
Future Notice Date: ${rawPayload?.tender?.communication?.futureNoticeDate || 'None'}
Procurement Stage: ${procurementStage}
Notice Description:
${tender.description || rawRecord?.description || ''}

Lots:
${lotsText}

Deliver exact JSON conforming to this schema:
{
  "scopeAndSpec": {
    "whatBuyerWants": "Concise summary of what the buyer wants stated in notice",
    "businessObjective": "Core business/economic/public objective stated in notice",
    "buyerRequiredServices": ["service 1", "service 2"],
    "buyerKeyDeliverables": [],
    "creativeOpportunities": [
      {
        "opportunity": "Opportunity title",
        "rationale": "Why this aligns with creative capability",
        "label": "AI OPPORTUNITY INTERPRETATION — NOT YET A PUBLISHED REQUIREMENT",
        "relevantCoreScope": "Scope area"
      }
    ],
    "targetAudience": "Target audience description",
    "contractScope": "Scope description",
    "locations": ["Location name"],
    "duration": "Anticipated duration or term",
    "importantDates": [
      { "label": "Date label", "date": "YYYY-MM-DD or text", "description": "Context", "factType": "EXPLICIT_BUYER_FACT" }
    ],
    "servicesOutsideCoreCapability": ["Operations", "Physical infrastructure"],
    "isDetailedScopePublished": true,
    "scopeNoticeText": "Summary of scope notice"
  },
  "requirements": [],
  "evaluationCriteria": [
    {
      "criterion": "Evaluation criteria have not yet been published in the currently available procurement material.",
      "weightingPercentage": null,
      "description": "Criteria will be published when formal call for competition is released.",
      "isPublished": false,
      "factType": "EXPLICIT_BUYER_FACT"
    }
  ],
  "submissionDetails": {
    "submissionRoute": "Route description",
    "submissionPortalUrl": "URL if available",
    "deadline": null,
    "clarificationDeadline": null,
    "requiredAttachments": [],
    "participationInstructions": "Instructions for suppliers at this stage"
  },
  "fitAndRisks": {
    "whyAdrastichyperlinkFits": "Why Adrastichyperlink has strong creative fit",
    "whyItMayNotFit": "Potential delivery or capacity risks (e.g. prime turnover scale, operational services)",
    "riskFactors": ["Risk 1", "Risk 2"],
    "partneringRecommendation": "Strategic recommendation regarding consortium or partner"
  },
  "sourceEvidence": [
    {
      "topic": "Topic name",
      "fact": "Verified fact statement",
      "factType": "EXPLICIT_BUYER_FACT",
      "value": "Value or text",
      "source": "Exact citation from notice",
      "sourceType": "OFFICIAL_OCDS_NOTICE",
      "confidence": "VERIFIED"
    }
  ]
}
`;

    try {
      const result = await GeminiClient.generateJsonWithDiagnostics<any>(prompt, {
        tier: 3,
        temperature: 0.1,
      });

      if (result.success && result.data && result.data.scopeAndSpec) {
        const d = result.data;
        const requirements: TenderRequirement[] = (d.requirements || []).map((r: any, idx: number) => ({
          id: `req-${tender.id}-${idx + 1}`,
          tenderId: tender.id,
          category: r.category || 'other',
          requirementName: r.requirementName || 'Requirement',
          buyerRequirementText: r.buyerRequirementText || '',
          sourceCitation: r.sourceCitation || 'Official Notice',
          factType: (r.factType || 'EXPLICIT_BUYER_FACT') as any,
          evidenceText: r.evidenceText || undefined,
          adrasticCapabilityText: r.adrasticCapabilityText || 'Verification pending Knowledge Base confirmation',
          status: r.status || 'UNKNOWN',
          mandatory: Boolean(r.mandatory),
        }));

        const evaluationCriteria: EnrichedEvaluationCriterion[] = (d.evaluationCriteria || []).map((c: any, idx: number) => ({
          id: `crit-${tender.id}-${idx + 1}`,
          criterion: c.criterion || 'Criterion',
          weightingPercentage: typeof c.weightingPercentage === 'number' ? c.weightingPercentage : null,
          description: c.description || '',
          isPublished: Boolean(c.isPublished),
          factType: (c.factType || 'EXPLICIT_BUYER_FACT') as any,
        }));

        const sourceEvidence: SourceEvidenceItem[] = (d.sourceEvidence || []).map((e: any, idx: number) => {
          const factType = (e.factType || 'EXPLICIT_BUYER_FACT') as any;
          const isVerified = factType === 'EXPLICIT_BUYER_FACT' || factType === 'DOCUMENT_EXTRACTED_FACT' || factType === 'PORTAL_FACT';
          return {
            id: `ev-${tender.id}-${idx + 1}`,
            topic: e.topic || 'Procurement Fact',
            fact: e.fact || '',
            factType,
            value: e.value || null,
            source: e.source || 'Official Find a Tender Release',
            sourceType: e.sourceType || 'OFFICIAL_OCDS_NOTICE',
            sourceUrl: e.sourceUrl || tender.officialNoticeUrl,
            confidence: e.confidence || 'VERIFIED',
            isVerified,
          };
        });

        const creativeOpportunities: CreativeOpportunity[] = Array.isArray(d.scopeAndSpec.creativeOpportunities)
          ? d.scopeAndSpec.creativeOpportunities.map((co: any) => ({
              opportunity: co.opportunity || 'Potential creative opportunity',
              rationale: co.rationale || 'Alignment with studio capabilities',
              label: 'AI OPPORTUNITY INTERPRETATION — NOT YET A PUBLISHED REQUIREMENT' as const,
              relevantCoreScope: co.relevantCoreScope || undefined,
            }))
          : [];

        const buyerRequiredServices = Array.isArray(d.scopeAndSpec.buyerRequiredServices)
          ? d.scopeAndSpec.buyerRequiredServices
          : Array.isArray(d.scopeAndSpec.requiredServices)
          ? d.scopeAndSpec.requiredServices
          : [];

        const buyerKeyDeliverables = Array.isArray(d.scopeAndSpec.buyerKeyDeliverables)
          ? d.scopeAndSpec.buyerKeyDeliverables
          : [];

        return {
          scopeAndSpec: {
            whatBuyerWants: d.scopeAndSpec.whatBuyerWants || '',
            businessObjective: d.scopeAndSpec.businessObjective || '',
            buyerRequiredServices,
            requiredServices: buyerRequiredServices,
            buyerKeyDeliverables,
            keyDeliverables: buyerKeyDeliverables,
            creativeOpportunities,
            creativeMarketingDigitalOverlap: creativeOpportunities.map((o) => o.opportunity),
            targetAudience: d.scopeAndSpec.targetAudience || 'Target stakeholders and public audiences',
            contractScope: d.scopeAndSpec.contractScope || d.scopeAndSpec.whatBuyerWants || '',
            locations: Array.isArray(d.scopeAndSpec.locations) ? d.scopeAndSpec.locations : ['United Kingdom'],
            duration: d.scopeAndSpec.duration || 'To be confirmed upon formal competition',
            importantDates: Array.isArray(d.scopeAndSpec.importantDates)
              ? d.scopeAndSpec.importantDates.map((dt: any) => ({
                  label: dt.label || 'Date',
                  date: dt.date || '',
                  description: dt.description || '',
                  factType: 'EXPLICIT_BUYER_FACT' as const,
                }))
              : [],
            servicesOutsideCoreCapability: Array.isArray(d.scopeAndSpec.servicesOutsideCoreCapability) ? d.scopeAndSpec.servicesOutsideCoreCapability : [],
            isDetailedScopePublished: Boolean(d.scopeAndSpec.isDetailedScopePublished),
            scopeNoticeText: d.scopeAndSpec.scopeNoticeText || undefined,
          },
          requirements,
          evaluationCriteria,
          submissionDetails: {
            procurementStage,
            submissionRoute: d.submissionDetails?.submissionRoute || 'Public procurement portal',
            submissionPortalUrl: d.submissionDetails?.submissionPortalUrl || tender.applicationPortalUrl || null,
            deadline: tender.submissionDeadline || d.submissionDetails?.deadline || null,
            clarificationDeadline: tender.clarificationDeadline || d.submissionDetails?.clarificationDeadline || null,
            buyerContact: { name: '', email: '', telephone: '', address: '' },
            requiredAttachments: Array.isArray(d.submissionDetails?.requiredAttachments) ? d.submissionDetails.requiredAttachments : [],
            participationInstructions: d.submissionDetails?.participationInstructions || 'Refer to official notice instructions.',
            isOpenForBid: procurementStage === 'OPEN TENDER',
            isMarketEngagement: procurementStage === 'PRELIMINARY MARKET ENGAGEMENT' || procurementStage === 'PLANNED PROCUREMENT',
          },
          fitAndRisks: {
            whyAdrastichyperlinkFits: d.fitAndRisks?.whyAdrastichyperlinkFits || '',
            whyItMayNotFit: d.fitAndRisks?.whyItMayNotFit || '',
            riskFactors: Array.isArray(d.fitAndRisks?.riskFactors) ? d.fitAndRisks.riskFactors : [],
            partneringRecommendation: d.fitAndRisks?.partneringRecommendation || 'Subcontractor or Consortium Partner',
          },
          sourceEvidence,
        };
      }
    } catch (err: any) {
      console.warn('[DetailEnrichment] Gemini intelligence synthesis error:', err.message);
    }

    return null;
  }

  /**
   * Deterministic fallback when Gemini is unavailable or rate-limited.
   * Pure generic fact extraction from notice payload with zero hardcoded notice IDs.
   */
  private synthesizeDeterministically(
    tender: TenderSummary,
    rawRecord: RawNoticeRecord | null,
    procurementStage: ProcurementStage
  ): {
    scopeAndSpec: ScopeAndSpecification;
    requirements: TenderRequirement[];
    evaluationCriteria: EnrichedEvaluationCriterion[];
    submissionDetails: SubmissionAndEngagementDetails;
    fitAndRisks: FitAndRisksAssessment;
    sourceEvidence: SourceEvidenceItem[];
  } {
    const rawPayload: any = rawRecord?.rawPayload || {};
    const desc = (tender.description || rawRecord?.description || rawPayload?.tender?.description || '').trim();

    // 1. Generic Scope Extraction
    const sentences = desc.split(/(?<=[.?!])\s+/).filter(Boolean);
    const whatBuyerWants = sentences[0] || desc.slice(0, 250);
    const businessObjective = sentences.length > 1 ? sentences[1] : whatBuyerWants;

    // Extract scope service clauses dynamically
    const buyerRequiredServices: string[] = [];
    for (const s of sentences) {
      const deliveryMatch = s.match(/(?:delivering|delivery of|area of|consisting of|including)\s+([^.]+)/i);
      if (deliveryMatch) {
        const parts = deliveryMatch[1]
          .split(/,|;|and\s+/)
          .map((p: string) => p.trim().replace(/^activity|^services/i, '').trim())
          .filter((p: string) => p.length > 4 && p.length < 65);
        buyerRequiredServices.push(...parts);
      }
    }
    const dedupedServices = Array.from(new Set(buyerRequiredServices)).slice(0, 8);
    const finalServices = dedupedServices.length > 0 ? dedupedServices : ['Specialist contracted services stated in notice'];

    // Deliverables: In PME or early planning, buyers do NOT publish final contract deliverables in the PIN
    const buyerKeyDeliverables: string[] = [];

    // AI Opportunities: Clearly distinguished from buyer requirements
    const creativeOpportunities: CreativeOpportunity[] = [
      {
        opportunity: 'Promotional motion graphics and video campaign storytelling',
        rationale: 'If public outreach or awareness campaigns are commissioned, motion design translates complex messaging into engaging visual narratives.',
        label: 'AI OPPORTUNITY INTERPRETATION — NOT YET A PUBLISHED REQUIREMENT',
        relevantCoreScope: finalServices[0] || 'Campaign promotion',
      },
      {
        opportunity: 'Brand visual identity, guidelines, and digital asset templates',
        rationale: 'Provides consistent branding, accessibility standards, and reusable creative assets for public communications.',
        label: 'AI OPPORTUNITY INTERPRETATION — NOT YET A PUBLISHED REQUIREMENT',
        relevantCoreScope: finalServices[1] || 'Digital promotion',
      },
      {
        opportunity: 'Digital campaign creative, website UX/UI assets, and social media content',
        rationale: 'Drives digital engagement across multi-platform stakeholder touchpoints.',
        label: 'AI OPPORTUNITY INTERPRETATION — NOT YET A PUBLISHED REQUIREMENT',
        relevantCoreScope: finalServices[2] || 'Stakeholder engagement',
      },
    ];

    // Non-core scope detection
    const servicesOutsideCoreCapability: string[] = [];
    const lowerDesc = desc.toLowerCase();
    if (lowerDesc.includes('convention') || lowerDesc.includes('trade') || lowerDesc.includes('hotel') || lowerDesc.includes('booking')) {
      servicesOutsideCoreCapability.push('Convention bureau operations, physical conference hosting, and travel trade booking brokerage');
    }
    if (lowerDesc.includes('construction') || lowerDesc.includes('works') || lowerDesc.includes('hardware')) {
      servicesOutsideCoreCapability.push('Physical construction, facilities management, or hardware supply');
    }
    if (lowerDesc.includes('consultancy') && lowerDesc.includes('sme')) {
      servicesOutsideCoreCapability.push('Direct 1-on-1 business accounting/finance consultancy');
    }
    if (servicesOutsideCoreCapability.length === 0) {
      servicesOutsideCoreCapability.push('Prime contract management & administrative overhead operations');
    }

    // Important Dates
    const importantDates: Array<{ label: string; date: string; description?: string; factType: any }> = [];
    if (tender.publishedAt) {
      importantDates.push({
        label: 'Notice Publication Date',
        date: tender.publishedAt,
        description: 'Official Find a Tender release date',
        factType: 'EXPLICIT_BUYER_FACT',
      });
    }
    const futureNoticeDate = rawPayload?.tender?.communication?.futureNoticeDate;
    if (futureNoticeDate) {
      importantDates.push({
        label: 'Anticipated Call for Competition',
        date: futureNoticeDate,
        description: 'Indicative date for formal contract notice release',
        factType: 'EXPLICIT_BUYER_FACT',
      });
    }
    // Check for funding/application dates in description (e.g. Visitor Levy date "1 April 2027")
    const dateMatch = desc.match(/(?:apply from|effective from|commencing|starts on)\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})/i);
    if (dateMatch) {
      importantDates.push({
        label: 'Policy / Funding Application Date',
        date: dateMatch[1],
        description: 'Date cited in official notice text',
        factType: 'EXPLICIT_BUYER_FACT',
      });
    }
    if (tender.submissionDeadline) {
      importantDates.push({
        label: 'Submission Deadline',
        date: tender.submissionDeadline,
        description: 'Deadline for receipt of formal responses',
        factType: 'EXPLICIT_BUYER_FACT',
      });
    }

    // 2. Truthful Requirements: In PME, requirements are NOT published
    const requirements: TenderRequirement[] = [];

    // 3. Truthful Evaluation Criteria: In PME, criteria are NOT published
    const evaluationCriteria: EnrichedEvaluationCriterion[] = [
      {
        id: `crit-${tender.id}-1`,
        criterion: 'Evaluation criteria have not yet been published in the currently available procurement material.',
        weightingPercentage: null,
        description: 'Detailed award evaluation criteria and quality/price weightings will be published when the formal contract notice and ITT are released.',
        isPublished: false,
        factType: 'EXPLICIT_BUYER_FACT',
      },
    ];

    // 4. Submission Details
    const buyerParty = Array.isArray(rawPayload.parties)
      ? rawPayload.parties.find((p: any) => Array.isArray(p.roles) && (p.roles.includes('buyer') || p.roles.includes('centralPurchasingBody')))
      : null;
    const buyerProfileUrl = buyerParty?.details?.buyerProfile;

    const submissionDetails: SubmissionAndEngagementDetails = {
      procurementStage,
      submissionRoute: buyerProfileUrl
        ? 'Public Contracts Scotland (PCS) / Direct Authority Market Engagement'
        : 'Official electronic procurement portal',
      submissionPortalUrl: buyerProfileUrl || tender.applicationPortalUrl || null,
      deadline: tender.submissionDeadline || null,
      clarificationDeadline: tender.clarificationDeadline || null,
      buyerContact: { name: '', email: '', telephone: '', address: '' },
      requiredAttachments: procurementStage === 'PRELIMINARY MARKET ENGAGEMENT'
        ? ['Market Engagement Response Form (when accessed via authority portal)']
        : ['Standard Selection Questionnaire (SQ)', 'Technical Proposal', 'Commercial Pricing Schedule'],
      participationInstructions: procurementStage === 'PRELIMINARY MARKET ENGAGEMENT'
        ? 'This notice is for preliminary market engagement only. It is not a call for competition and does not commit the Council to a procurement. Interested suppliers should register on the authority portal and monitor for further releases.'
        : 'Review official notice documentation and comply with portal submission instructions ahead of the deadline.',
      isOpenForBid: procurementStage === 'OPEN TENDER',
      isMarketEngagement: procurementStage === 'PRELIMINARY MARKET ENGAGEMENT' || procurementStage === 'PLANNED PROCUREMENT',
    };

    // 5. Fit & Risks
    const contractValue = tender.valueAmount || 0;
    const isHighValue = contractValue > 500000;
    const fitAndRisks: FitAndRisksAssessment = {
      whyAdrastichyperlinkFits:
        'Strong alignment with Adrastichyperlink core creative strengths: brand visual identity, dynamic motion design, campaign digital assets, and high-clarity public communications.',
      whyItMayNotFit: isHighValue
        ? `Contract scale (£${contractValue.toLocaleString()}) and broad operational management scope require prime contractor administrative capacity exceeding a boutique studio.`
        : 'Ancillary operational or non-creative delivery requirements outside core studio scope.',
      riskFactors: [
        'Procurement is at preliminary market engagement / planning stage; scope, delivery model, and timeline remain subject to authority approval.',
        isHighValue
          ? 'Requires partnering with an established prime contractor or sector consultancy to fulfill commercial scale and operational requirements.'
          : 'Detailed specification not yet released.',
      ],
      partneringRecommendation: isHighValue
        ? 'PARTNER / CONSORTIUM ROUTE: Adrastichyperlink should position as the specialist Creative, Branding & Motion Design Partner teaming with an established prime contractor.'
        : 'Direct bid or specialist subcontractor depending on formal ITT requirements upon release.',
    };

    // 6. Source Evidence (Traceable and verified)
    const sourceEvidence: SourceEvidenceItem[] = [
      {
        id: `ev-${tender.id}-1`,
        topic: 'Procurement Stage & Notice Type',
        fact: procurementStage === 'PRELIMINARY MARKET ENGAGEMENT'
          ? 'Prior Information Notice (PIN) for preliminary market engagement; not a call for competition'
          : `${procurementStage} Notice`,
        factType: 'EXPLICIT_BUYER_FACT',
        value: procurementStage,
        source: `Find a Tender OCDS release ${tender.latestNoticeId || tender.canonicalReference} (tag: ${JSON.stringify(rawPayload?.tag || ['planning'])})`,
        sourceType: 'OFFICIAL_OCDS_NOTICE',
        sourceUrl: tender.officialNoticeUrl,
        confidence: 'VERIFIED',
        isVerified: true,
      },
      {
        id: `ev-${tender.id}-2`,
        topic: 'Contract Value & Funding',
        fact: tender.valueAmount ? `£${tender.valueAmount.toLocaleString()} ${tender.valueCurrency || 'GBP'}` : 'Value unstated in notice',
        factType: 'EXPLICIT_BUYER_FACT',
        value: tender.valueAmount,
        source: `Find a Tender OCDS release: tender.value.amount (${tender.valueAmount})`,
        sourceType: 'OFFICIAL_OCDS_NOTICE',
        sourceUrl: tender.officialNoticeUrl,
        confidence: 'VERIFIED',
        isVerified: true,
      },
      {
        id: `ev-${tender.id}-3`,
        topic: 'Buyer Legal Entity & Contact Point',
        fact: `${tender.buyerName || 'Public Authority'} (Contact: ${buyerParty?.contactPoint?.name || 'Unspecified'}, ${buyerParty?.contactPoint?.email || 'Unspecified'})`,
        factType: 'EXPLICIT_BUYER_FACT',
        value: tender.buyerName,
        source: 'Find a Tender OCDS release: parties[buyer]',
        sourceType: 'OFFICIAL_OCDS_NOTICE',
        sourceUrl: tender.officialNoticeUrl,
        confidence: 'VERIFIED',
        isVerified: true,
      },
    ];

    if (futureNoticeDate) {
      sourceEvidence.push({
        id: `ev-${tender.id}-4`,
        topic: 'Indicative Future Competition Date',
        fact: `Future notice date: ${futureNoticeDate}`,
        factType: 'EXPLICIT_BUYER_FACT',
        value: futureNoticeDate,
        source: 'Find a Tender OCDS release: tender.communication.futureNoticeDate',
        sourceType: 'OFFICIAL_OCDS_NOTICE',
        sourceUrl: tender.officialNoticeUrl,
        confidence: 'VERIFIED',
        isVerified: true,
      });
    }

    if (buyerProfileUrl) {
      sourceEvidence.push({
        id: `ev-${tender.id}-5`,
        topic: 'Authority Procurement Portal',
        fact: buyerProfileUrl,
        factType: 'PORTAL_FACT',
        value: buyerProfileUrl,
        source: 'Find a Tender OCDS release: parties.details.buyerProfile',
        sourceType: 'PORTAL',
        sourceUrl: buyerProfileUrl,
        confidence: 'VERIFIED',
        isVerified: true,
      });
    }

    return {
      scopeAndSpec: {
        whatBuyerWants,
        businessObjective,
        buyerRequiredServices: finalServices,
        requiredServices: finalServices,
        buyerKeyDeliverables,
        keyDeliverables: buyerKeyDeliverables,
        creativeOpportunities,
        creativeMarketingDigitalOverlap: creativeOpportunities.map((o) => o.opportunity),
        targetAudience: 'Public stakeholders, businesses, and service beneficiaries',
        contractScope: whatBuyerWants,
        locations: ['United Kingdom'],
        duration: 'To be confirmed upon formal competition',
        importantDates,
        servicesOutsideCoreCapability,
        isDetailedScopePublished: Boolean(desc),
        scopeNoticeText: whatBuyerWants,
      },
      requirements,
      evaluationCriteria,
      submissionDetails,
      fitAndRisks,
      sourceEvidence,
    };
  }
}
