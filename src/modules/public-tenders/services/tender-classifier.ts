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

export type TenderClassification = z.infer<typeof TenderClassificationSchema>;

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
   * Employs deterministic negative exclusion first, then Gemini AI structured classification.
   */
  static async classify(input: ClassifierInput): Promise<TenderClassification> {
    // 1. Fast deterministic pre-filter
    const deterministic = DeterministicFilter.evaluate({
      title: input.title,
      description: input.description,
      cpvCodes: input.cpvCodes,
      noticeType: input.noticeType,
    });

    // If deterministic filter strongly rejected (e.g. CCTV, surveillance, sign manufacturing), don't waste AI calls
    if (deterministic.isNegativeMatch || deterministic.qualification === 'REJECT') {
      return {
        relevance: 'REJECT',
        serviceMatches: [],
        reason: deterministic.rejectedReason || 'Opportunity rejected by deterministic exclusion criteria.',
        falsePositive: deterministic.isNegativeMatch,
        confidence: 95,
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
        const result = await GeminiClient.generateJson<TenderClassification>(prompt, {
          tier: 1,
          temperature: 0.1,
          systemInstruction:
            'You are an expert UK public procurement classifier evaluating creative studio fit. Be strict, truthful, and reject surveillance, CCTV, sign manufacturing, and non-creative IT.',
        });

        if (result) {
          const validated = TenderClassificationSchema.safeParse(result);
          if (validated.success) {
            return validated.data;
          }
        }
      } catch (err: any) {
        console.error('TenderClassifier Gemini error:', err.message);
      }
    }

    // 3. Truthful fallback when Gemini is unavailable or failed
    return {
      relevance: deterministic.qualification,
      serviceMatches: deterministic.matchedKeywords,
      reason:
        deterministic.matchedKeywords.length > 0
          ? `Deterministic match on creative keywords: ${deterministic.matchedKeywords.join(', ')} (Gemini unconfigured)`
          : 'Candidate retained for manual review (Gemini unconfigured)',
      falsePositive: false,
      confidence: deterministic.score,
    };
  }
}
