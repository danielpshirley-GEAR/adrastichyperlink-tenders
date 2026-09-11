// src/modules/public-tenders/services/tender-classifier.ts
import { z } from 'zod';
import { GeminiClient } from '@/shared/ai/gemini-client';
import { DeterministicFilter } from './deterministic-filter';

export const GeminiAnalysisSchema = z.object({
  whatTheyAreBuying: z.string().default('UNKNOWN'),
  whyTheyNeedIt: z.string().default('UNKNOWN'),
  relevantServices: z.array(z.string()).default([]),
  keyDeliverables: z.array(z.string()).default([]),
  buyer: z.string().default('UNKNOWN'),
  value: z.string().default('UNKNOWN'),
  deadline: z.string().default('UNKNOWN'),
  eligibilityIssues: z.string().default('UNKNOWN'),
  whyAdrastichyperlinkFits: z.string().default('UNKNOWN'),
  whyItMayNotFit: z.string().default('UNKNOWN'),
  partnerRequirement: z.string().default('UNKNOWN'),
  bidEffort: z.string().default('MEDIUM'),
  recommendation: z.enum(['STRONG BID', 'INVESTIGATE', 'WATCH', 'PARTNER', 'PASS']).default('WATCH'),
  isPartnerRoute: z.boolean().default(false),
});

export type GeminiAnalysis = z.infer<typeof GeminiAnalysisSchema>;

export const TenderClassificationSchema = z.object({
  relevance: z.enum(['STRONG', 'POSSIBLE', 'WEAK', 'REJECT']),
  serviceMatches: z.array(z.string()),
  reason: z.string(),
  falsePositive: z.boolean(),
  confidence: z.number().min(0).max(100),
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
    relevance?: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
    serviceMatches: string[];
    reason?: string;
    confidence?: number;
    model?: string;
    analysis?: GeminiAnalysis;
  };
  final: {
    relevance: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
    reason: string;
    serviceMatches: string[];
    recommendation?: 'STRONG BID' | 'INVESTIGATE' | 'WATCH' | 'PARTNER' | 'PASS';
    analysis?: GeminiAnalysis;
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

    // If deterministic filter strongly rejected (e.g. CCTV, surveillance, sign manufacturing), do not waste AI calls
    if (deterministic.isNegativeMatch || (deterministic.qualification === 'REJECT' && !deterministic.isExpired)) {
      return {
        deterministic: deterministicResult,
        ai: {
          status: 'NOT_RUN',
          serviceMatches: [],
        },
        final: {
          relevance: 'REJECT',
          reason: deterministic.rejectedReason || 'Opportunity rejected by deterministic exclusion criteria.',
          serviceMatches: [],
        },
      };
    }

    // 2. If Gemini is configured, use structured LLM classification
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

CRITICAL EVALUATION RULES:
1. PURE MEDIA BUYING EXCLUSION:
   - Procurements strictly for media buying or media planning alone (e.g. purchasing ad space, billboard placements, TV slots, or media budget management without creative content production, such as Robert Gordon University Media Planning & Buying) MUST be classified as REJECT.
2. EXPLICIT REJECTIONS:
   - Video surveillance / CCTV cameras, software licenses / subscriptions, physical sign / metal fabrication, web hosting only, architectural/structural CAD engineering, security guarding, catering, cleaning.
3. LARGE OPPORTUNITIES (DO NOT HIDE OR AUTO-REJECT):
   - If a contract is high-value (e.g. multi-million pound framework, major agency roster) but includes creative/campaign/motion/video/brand scope, DO NOT automatically reject for size.
   - Classify as "POSSIBLE" (with analysis.isPartnerRoute: true and analysis.recommendation: "PARTNER" or "WATCH"), explaining that Adrastichyperlink can deliver the specialist motion, animation, brand, or video elements in partnership, as a consortium member, or as a subcontractor.
4. HONEST INFORMATION:
   - Do not invent missing facts. Use "UNKNOWN" if details like exact budget or specific deliverables are absent from the notice.

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
    "recommendation": "STRONG BID" | "INVESTIGATE" | "WATCH" | "PARTNER" | "PASS",
    "isPartnerRoute": false
  }
}
`;

      try {
        const result = await GeminiClient.generateJson<{
          relevance: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
          serviceMatches: string[];
          reason: string;
          falsePositive: boolean;
          confidence: number;
          analysis?: GeminiAnalysis;
        }>(prompt, {
          tier: 1,
          temperature: 0.1,
          systemInstruction:
            'You are an expert UK public procurement classifier evaluating creative studio fit. Be strict, truthful, and reject surveillance, CCTV, sign manufacturing, and non-creative IT.',
        });

        if (result) {
          const validated = TenderClassificationSchema.safeParse(result);
          if (validated.success) {
            return {
              deterministic: deterministicResult,
              ai: {
                status: 'RUN',
                relevance: validated.data.relevance,
                serviceMatches: validated.data.serviceMatches,
                reason: validated.data.reason,
                confidence: validated.data.confidence,
                model: GeminiClient.getModelForTier(1),
                analysis: validated.data.analysis,
              },
              final: {
                relevance: validated.data.relevance,
                reason: validated.data.reason,
                serviceMatches: validated.data.serviceMatches,
                recommendation: validated.data.analysis?.recommendation,
                analysis: validated.data.analysis,
              },
            };
          }
        }
      } catch (err: any) {
        console.error('TenderClassifier Gemini error:', err.message);
        return {
          deterministic: deterministicResult,
          ai: {
            status: 'FAILED',
            serviceMatches: [],
            reason: `Gemini execution error: ${err.message}`,
            model: GeminiClient.getModelForTier(1),
          },
          final: {
            relevance: deterministic.qualification,
            reason: `Gemini failed; retained via deterministic filter: ${deterministic.matchedKeywords.join(', ')}`,
            serviceMatches: deterministic.matchedKeywords,
          },
        };
      }
    }

    // 3. Truthful fallback when Gemini is unconfigured
    return {
      deterministic: deterministicResult,
      ai: {
        status: 'UNCONFIGURED',
        serviceMatches: [],
      },
      final: {
        relevance: deterministic.qualification,
        reason:
          deterministic.matchedKeywords.length > 0
            ? `Deterministic match on creative keywords: ${deterministic.matchedKeywords.join(', ')} (Gemini unconfigured)`
            : 'Candidate retained for manual review (Gemini unconfigured)',
        serviceMatches: deterministic.matchedKeywords,
      },
    };
  }
}
