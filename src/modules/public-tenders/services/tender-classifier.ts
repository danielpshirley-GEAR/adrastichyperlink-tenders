// src/modules/public-tenders/services/tender-classifier.ts
import { z } from 'zod';
import { GeminiClient, GeminiFailureCategory } from '@/shared/ai/gemini-client';
import { DeterministicFilter } from './deterministic-filter';

export const PrimaryPurposeEnum = z.enum([
  'CREATIVE_MARKETING',
  'CREATIVE_PRODUCTION',
  'DIGITAL_DESIGN',
  'CONSULTANCY_WITH_CREATIVE_OVERLAP',
  'PHYSICAL_FABRICATION',
  'CONSTRUCTION',
  'IT_HARDWARE',
  'CCTV_SECURITY',
  'MEDIA_BUYING',
  'OTHER',
]);

export type PrimaryPurpose = z.infer<typeof PrimaryPurposeEnum>;

export const GeminiAnalysisSchema = z.object({
  primaryPurpose: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase().trim() : val),
    PrimaryPurposeEnum
  ).catch('OTHER'),
  whatTheyAreBuying: z.string().catch('UNKNOWN'),
  whyTheyNeedIt: z.string().catch('UNKNOWN'),
  relevantServices: z.array(z.string()).catch([]),
  keyDeliverables: z.array(z.string()).catch([]),
  buyer: z.string().catch('UNKNOWN'),
  value: z.string().catch('UNKNOWN'),
  deadline: z.string().catch('UNKNOWN'),
  eligibilityIssues: z.string().catch('UNKNOWN'),
  whyAdrastichyperlinkFits: z.string().catch('UNKNOWN'),
  whyItMayNotFit: z.string().catch('UNKNOWN'),
  partnerRequirement: z.string().catch('UNKNOWN'),
  bidEffort: z.string().catch('MEDIUM'),
  recommendation: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase().trim() : val),
    z.enum(['STRONG BID', 'INVESTIGATE', 'WATCH', 'PARTNER', 'PASS', 'REVIEW'])
  ).catch('REVIEW'),
  isPartnerRoute: z.boolean().catch(false),
});

export type GeminiAnalysis = z.infer<typeof GeminiAnalysisSchema>;

export const TenderClassificationSchema = z.object({
  relevance: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase().trim() : val),
    z.enum(['STRONG', 'POSSIBLE', 'WEAK', 'REJECT'])
  ).catch('POSSIBLE'),
  serviceMatches: z.array(z.string()).catch([]),
  reason: z.string().catch('Evaluated by Gemini'),
  falsePositive: z.boolean().catch(false),
  confidence: z.coerce.number().catch(75),
  analysis: GeminiAnalysisSchema.optional(),
});

export interface ClassificationResult {
  deterministic: {
    relevance: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
    matchedKeywords: string[];
    matchedCpvs?: string[];
    rejectedReason?: string;
    score: number;
    isExpired?: boolean;
  };
  ai: {
    status: 'RUN' | 'NOT_RUN' | 'FAILED' | 'UNCONFIGURED';
    aiReviewStatus?: 'COMPLETED' | 'REQUIRED' | 'SKIPPED';
    failureCategory?: GeminiFailureCategory;
    relevance?: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
    primaryPurpose?: PrimaryPurpose;
    serviceMatches: string[];
    reason?: string;
    confidence?: number;
    model?: string;
    analysis?: GeminiAnalysis;
  };
  final: {
    relevance: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
    primaryPurpose?: PrimaryPurpose;
    reason: string;
    serviceMatches: string[];
    recommendation?: 'STRONG BID' | 'INVESTIGATE' | 'WATCH' | 'PARTNER' | 'PASS' | 'REVIEW';
    analysis?: GeminiAnalysis;
    reasonFinalQualificationWasChosen: string;
  };
}

export type TenderClassification = ClassificationResult;

export interface ClassifierInput {
  title?: string | null;
  buyer?: string | null;
  description: string;
  cpvCodes?: string[];
  noticeType?: string;
  valueAmount?: number | null;
  submissionDeadline?: string | null;
}

export class TenderClassifier {
  /**
   * Evaluates an incoming public sector procurement opportunity.
   * Genuinely separates deterministic keyword pre-filter from Gemini AI structured classification.
   */
  static async classify(input: ClassifierInput): Promise<ClassificationResult> {
    // 1. Fast deterministic pre-filter
    const deterministic = DeterministicFilter.evaluate({
      title: input.title,
      description: input.description,
      cpvCodes: input.cpvCodes,
      noticeType: input.noticeType,
      submissionDeadline: input.submissionDeadline,
    });

    const deterministicResult = {
      relevance: deterministic.qualification,
      matchedKeywords: deterministic.matchedKeywords,
      matchedCpvs: deterministic.matchedCpvs,
      rejectedReason: deterministic.rejectedReason || undefined,
      score: deterministic.score,
      isExpired: deterministic.isExpired,
    };

    // If deterministic filter strongly rejected (e.g. CCTV, surveillance, sign manufacturing, property maintenance), do not waste AI calls
    if (deterministic.isNegativeMatch || (deterministic.qualification === 'REJECT' && !deterministic.isExpired)) {
      return {
        deterministic: deterministicResult,
        ai: {
          status: 'NOT_RUN',
          aiReviewStatus: 'SKIPPED',
          serviceMatches: [],
        },
        final: {
          relevance: 'REJECT',
          reason: deterministic.rejectedReason || 'Opportunity rejected by deterministic exclusion criteria.',
          serviceMatches: [],
          recommendation: 'PASS',
          reasonFinalQualificationWasChosen: deterministic.rejectedReason || 'Opportunity rejected by deterministic exclusion criteria.',
        },
      };
    }

    // 2. If Gemini is configured, use structured LLM classification with bounded retry
    if (GeminiClient.isConfigured()) {
      const prompt = `
Evaluate whether the following UK public sector procurement notice is relevant to Adrastichyperlink.

ADRASTICHYPERLINK CAPABILITY PROFILE:
- Specialist Creative Studio & Motion Direction Partner:
  * Motion design, 2D animation, 3D animation
  * Video production, video editing, explainer video production
  * Graphic design, branding, brand strategy, visual identity
  * Creative strategy, campaign creative, advertising creative, content creation
  * Public information campaigns, internal communications, change communications
  * Information design, presentation design, digital design, website design, UX/UI
  * Interactive digital experiences, training / learning content, creative production.

PRIMARY PROCUREMENT PURPOSE CLASSIFICATION (STAGE 1):
Before deciding relevance, determine the substantive primary procurement purpose from actual lots, primary deliverables, specification, and buyer requirement (NOT isolated keywords):
- "CREATIVE_MARKETING": Destination marketing, promotional campaigns, public awareness campaigns, brand strategy, campaign creative.
- "CREATIVE_PRODUCTION": Motion design, 2D/3D animation, video production, video editing, explainer films, digital interactive content creation.
- "DIGITAL_DESIGN": Website design, UX/UI design, information design, digital interactive experiences.
- "CONSULTANCY_WITH_CREATIVE_OVERLAP": Broad business advisory frameworks (e.g. Glasgow Business Growth Programme) where specific lots include sales, digital marketing, and branding. (Classify as POSSIBLE / WATCH; clearly distinguish as consultancy/business-support delivery, not primary creative production).
- "PHYSICAL_FABRICATION": Physical exhibition fitout/build, joinery, display build and installation, signage manufacturing, where artwork/graphics are supplied by client or incidental (e.g. RBGE exhibition fitout). MUST BE CLASSIFIED AS REJECT.
- "CONSTRUCTION": Property maintenance, housing repairs, builder works, plumbing, heating, joinery, electrical, roofing, civils, groundworks (e.g. Highland Council). MUST BE CLASSIFIED AS REJECT.
- "IT_HARDWARE": Computer hardware, servers, network cabling, infrastructure, software licensing. MUST BE CLASSIFIED AS REJECT.
- "CCTV_SECURITY": Surveillance cameras, security guarding, access control. MUST BE CLASSIFIED AS REJECT.
- "MEDIA_BUYING": Purchasing advertising space, billboard slots, media planning without creative content (e.g. Robert Gordon University). MUST BE CLASSIFIED AS REJECT.
- "OTHER": Non-creative goods or services. MUST BE CLASSIFIED AS REJECT.

CORE EVALUATION LAW:
INCIDENTAL CREATIVE TERMS DO NOT OVERRIDE PRIMARY PROCUREMENT PURPOSE.
Determine relevance from: 1. actual lots, 2. primary deliverables, 3. specification, 4. buyer requirement — NOT isolated keywords.
If primaryPurpose is CONSTRUCTION, PHYSICAL_FABRICATION, IT_HARDWARE, CCTV_SECURITY, or MEDIA_BUYING, relevance MUST be REJECT.

TENDER DETAILS:
Title: ${input.title || 'Untitled'}
Buyer: ${input.buyer || 'Unknown'}
Notice Type: ${input.noticeType || 'Tender'}
Estimated Value: ${input.valueAmount ? `£${input.valueAmount.toLocaleString()}` : 'Unspecified'}
CPV Codes: ${(input.cpvCodes || []).join(', ') || 'None provided'}
Deadline: ${input.submissionDeadline || 'Unspecified'}
Description:
${input.description.slice(0, 3500)}

Respond strictly in valid JSON matching this schema:
{
  "relevance": "STRONG" | "POSSIBLE" | "WEAK" | "REJECT",
  "serviceMatches": ["list of matching creative capabilities"],
  "reason": "Clear concise 1-2 sentence plain-English rationale for the decision",
  "falsePositive": false,
  "confidence": number between 0 and 100,
  "analysis": {
    "primaryPurpose": "CREATIVE_MARKETING" | "CREATIVE_PRODUCTION" | "DIGITAL_DESIGN" | "CONSULTANCY_WITH_CREATIVE_OVERLAP" | "PHYSICAL_FABRICATION" | "CONSTRUCTION" | "IT_HARDWARE" | "CCTV_SECURITY" | "MEDIA_BUYING" | "OTHER",
    "whatTheyAreBuying": "Concise description of procurement scope",
    "whyTheyNeedIt": "Context/purpose for buyer",
    "relevantServices": ["Matching Adrastichyperlink services"],
    "keyDeliverables": ["Specific expected deliverables or outputs"],
    "buyer": "Buyer organisation name",
    "value": "Contract value or UNKNOWN",
    "deadline": "Submission deadline or UNKNOWN",
    "eligibilityIssues": "Accreditation or turnover constraints, or NONE IDENTIFIED",
    "whyAdrastichyperlinkFits": "Specific studio strengths alignment",
    "whyItMayNotFit": "Potential delivery or scale challenges",
    "partnerRequirement": "Consortium/subcontractor needed, or NONE (DIRECT BID)",
    "bidEffort": "LOW" | "MEDIUM" | "HIGH",
    "recommendation": "STRONG BID" | "INVESTIGATE" | "WATCH" | "PARTNER" | "PASS" | "REVIEW",
    "isPartnerRoute": false
  }
}
`;

      try {
        const callResult = await GeminiClient.generateJsonWithDiagnostics<{
          relevance: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
          serviceMatches: string[];
          reason: string;
          falsePositive: boolean;
          confidence: number;
          analysis?: GeminiAnalysis;
        }>(
          prompt,
          {
            tier: 1,
            temperature: 0.1,
            systemInstruction:
              'You are an expert UK public procurement classifier evaluating creative studio fit. Be strict, truthful, and reject surveillance, CCTV, sign manufacturing, physical fitout, and non-creative IT.',
          },
          3
        );

        if (callResult.success && callResult.data) {
          const result = callResult.data;
          const validated = TenderClassificationSchema.safeParse(result);
          const data = validated.success
            ? validated.data
            : {
                relevance: 'POSSIBLE' as const,
                serviceMatches: (result as any)?.serviceMatches || [],
                reason:
                  typeof (result as any)?.reason === 'string'
                    ? (result as any).reason
                    : 'Opportunity evaluated by Gemini.',
                falsePositive: false,
                confidence: typeof (result as any)?.confidence === 'number' ? (result as any).confidence : 75,
                analysis: GeminiAnalysisSchema.safeParse((result as any)?.analysis).success
                  ? GeminiAnalysisSchema.parse((result as any)?.analysis)
                  : undefined,
              };

          const primaryPurpose = data.analysis?.primaryPurpose || 'OTHER';
          let finalRelevance = data.relevance;
          let reasonFinalQualificationWasChosen = data.reason;

          // Reusable rule enforcement: Incidental creative terms do not override substantive primary purpose
          if (
            primaryPurpose === 'CONSTRUCTION' ||
            primaryPurpose === 'PHYSICAL_FABRICATION' ||
            primaryPurpose === 'IT_HARDWARE' ||
            primaryPurpose === 'CCTV_SECURITY' ||
            primaryPurpose === 'MEDIA_BUYING'
          ) {
            finalRelevance = 'REJECT';
            reasonFinalQualificationWasChosen = `Primary procurement purpose is ${primaryPurpose}. Incidental creative or design terms do not override substantive non-creative purpose.`;
          }

          return {
            deterministic: deterministicResult,
            ai: {
              status: 'RUN',
              aiReviewStatus: 'COMPLETED',
              relevance: data.relevance,
              primaryPurpose,
              serviceMatches: data.serviceMatches,
              reason: data.reason,
              confidence: data.confidence,
              model: GeminiClient.getModelForTier(1),
              analysis: data.analysis,
            },
            final: {
              relevance: finalRelevance,
              primaryPurpose,
              reason: reasonFinalQualificationWasChosen,
              serviceMatches: data.serviceMatches,
              recommendation: data.analysis?.recommendation as any,
              analysis: data.analysis,
              reasonFinalQualificationWasChosen,
            },
          };
        } else {
          // Gemini failed after bounded retries
          const errorCategory = callResult.errorCategory || 'UNKNOWN';
          const errorMessage = callResult.errorMessage || 'Gemini returned empty response';
          return {
            deterministic: deterministicResult,
            ai: {
              status: 'FAILED',
              aiReviewStatus: 'REQUIRED',
              failureCategory: errorCategory,
              serviceMatches: [],
              reason: `[${errorCategory}] ${errorMessage}`,
              model: GeminiClient.getModelForTier(1),
            },
            final: {
              relevance: 'POSSIBLE', // preserve deterministic candidate for safety
              reason: `AI REVIEW INCOMPLETE (${errorCategory}): ${errorMessage}. Retained via deterministic filter for manual review.`,
              serviceMatches: deterministic.matchedKeywords,
              recommendation: 'REVIEW', // NOT an AI-derived recommendation
              reasonFinalQualificationWasChosen: `AI REVIEW INCOMPLETE [${errorCategory}]: ${errorMessage}. Unverified candidate retained as POSSIBLE with recommendation REVIEW.`,
            },
          };
        }
      } catch (err: any) {
        console.error('TenderClassifier Gemini error:', err.message);
        return {
          deterministic: deterministicResult,
          ai: {
            status: 'FAILED',
            aiReviewStatus: 'REQUIRED',
            failureCategory: 'UNKNOWN',
            serviceMatches: [],
            reason: `Gemini execution error: ${err.message}`,
            model: GeminiClient.getModelForTier(1),
          },
          final: {
            relevance: deterministic.qualification,
            reason: `AI REVIEW INCOMPLETE: ${err.message}. Retained via deterministic filter for manual review.`,
            serviceMatches: deterministic.matchedKeywords,
            recommendation: 'REVIEW',
            reasonFinalQualificationWasChosen: `AI REVIEW INCOMPLETE [UNKNOWN]: ${err.message}. Unverified candidate retained as POSSIBLE with recommendation REVIEW.`,
          },
        };
      }
    }

    // 3. Truthful fallback when Gemini is unconfigured
    return {
      deterministic: deterministicResult,
      ai: {
        status: 'UNCONFIGURED',
        aiReviewStatus: 'REQUIRED',
        serviceMatches: [],
      },
      final: {
        relevance: deterministic.qualification,
        reason:
          deterministic.matchedKeywords.length > 0
            ? `Deterministic match on creative keywords: ${deterministic.matchedKeywords.join(', ')} (Gemini unconfigured)`
            : 'Candidate retained for manual review (Gemini unconfigured)',
        serviceMatches: deterministic.matchedKeywords,
        recommendation: 'REVIEW',
        reasonFinalQualificationWasChosen: 'Gemini unconfigured; candidate retained based solely on deterministic keyword match with recommendation REVIEW.',
      },
    };
  }
}
