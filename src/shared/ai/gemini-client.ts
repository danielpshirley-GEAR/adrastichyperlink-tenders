// src/shared/ai/gemini-client.ts
// Server-side Gemini Client with Cost-Tier Routing & Strict Integrity

export interface GeminiCallOptions {
  tier: 1 | 2 | 3 | 4;
  systemInstruction?: string;
  temperature?: number;
}

export class GeminiClient {
  private static apiKey = process.env.GEMINI_API_KEY;

  static isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  static getModelForTier(tier: 1 | 2 | 3 | 4): string {
    switch (tier) {
      case 1:
        return 'gemini-1.5-flash'; // Cheap classification
      case 2:
        return 'gemini-1.5-flash'; // Tender candidate analysis
      case 3:
        return 'gemini-1.5-pro';   // Deep eligibility and document audit
      case 4:
        return 'gemini-1.5-pro';   // High-stakes bid writing & evidence checking
      default:
        return 'gemini-1.5-flash';
    }
  }

  static async generateJson<T>(prompt: string, options: GeminiCallOptions): Promise<T | null> {
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY is not configured on server.');
      return null;
    }
    // Future integration with @google/genai or REST API
    return null;
  }
}
