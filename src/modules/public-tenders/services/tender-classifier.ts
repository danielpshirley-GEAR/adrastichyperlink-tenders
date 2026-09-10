// src/modules/public-tenders/services/tender-classifier.ts
import { z } from 'zod';
import { GeminiClient } from '@/shared/ai/gemini-client';
import { DeterministicFilter } from './deterministic-filter';

export const TenderClassificationSchema = z.object({
  relevance: z.enum(['STRONG', 'POSSIBLE', 'WEAK', 'REJECT']),
  serviceMatches: z.array(z.string()),
  reason: z.string(),
  falsePositive: z.boolean(),
  confidence: z.number().min(0).max(100),
});

export interface ClassificationResult {
  deterministic: {
    relevance: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
    matchedKeywords: string[];
    rejectedReason?: string;
    score: number;
  };
  ai: {
    status: 'RUN' | 'NOT_RUN' | 'FAILED' | 'UNCONFIGURED';
    relevance?: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
    serviceMatches: string[];
    reason?: string;
    confidence?: number;
    model?: string;
  };
  final: {
    relevance: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
    reason: string;
    serviceMatches: string[];
  };
}

export type TenderClassification = ClassificationResult;

export interface ClassifierInput {
  title: string;
  buyer: string;
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
    });

    const deterministicResult = {
      relevance: deterministic.qualification,
      matchedKeywords: deterministic.matchedKeywords,
      rejectedReason: deterministic.rejectedReason || undefined,
      score: deterministic.score,
    };

    // If deterministic filter strongly rejected (e.g. CCTV, surveillance, sign manufacturing), do not waste AI calls
    if (deterministic.isNegativeMatch || deterministic.qualification === 'REJECT') {
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
- Specialist creative studio & motion direction partner.
- Core Services: Motion design, 2D/3D animation, brand identity, visual strategy, creative direction, graphic design, explainer video production, public health & outreach informational videos.
- EXPLICIT REJECTIONS: Video surveillance / CCTV cameras, software licenses / subscriptions, physical sign / metal fabrication, web hosting only, architectural/structural CAD engineering, security guarding.

TENDER DETAILS:
Title: ${input.title}
Buyer: ${input.buyer}
Notice Type: ${input.noticeType || 'Tender'}
Estimated Value: ${input.valueAmount ? `£${input.valueAmount.toLocaleString()}` : 'Unspecified'}
CPV Codes: ${(input.cpvCodes || []).join(', ') || 'None provided'}
Description:
${input.description.slice(0, 3000)}

Respond strictly in valid JSON matching this schema:
{
  "relevance": "STRONG" | "POSSIBLE" | "WEAK" | "REJECT",
  "serviceMatches": ["string list of matching creative capabilities"],
  "reason": "Clear concise 1-2 sentence plain-English rationale for the decision",
  "falsePositive": false,
  "confidence": number between 0 and 100
}
`;

      try {
        const result = await GeminiClient.generateJson<{
          relevance: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
          serviceMatches: string[];
          reason: string;
          falsePositive: boolean;
          confidence: number;
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
              },
              final: {
                relevance: validated.data.relevance,
                reason: validated.data.reason,
                serviceMatches: validated.data.serviceMatches,
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
