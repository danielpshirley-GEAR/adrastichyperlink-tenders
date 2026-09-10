// src/shared/ai/gemini-client.ts
import { GoogleGenAI } from '@google/genai';

export interface GeminiCallOptions {
  tier: 1 | 2 | 3 | 4;
  systemInstruction?: string;
  temperature?: number;
  responseSchema?: Record<string, any>;
}

export class GeminiClient {
  private static getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  static isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  static getModelForTier(tier: 1 | 2 | 3 | 4): string {
    const defaultFlash = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const defaultPro = process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro';

    switch (tier) {
      case 1:
      case 2:
        return defaultFlash;
      case 3:
      case 4:
        return defaultPro;
      default:
        return defaultFlash;
    }
  }

  static async generateJson<T>(prompt: string, options: GeminiCallOptions): Promise<T | null> {
    const ai = this.getClient();
    if (!ai) {
      return null;
    }

    const modelName = this.getModelForTier(options.tier);

    try {
      const config: any = {
        responseMimeType: 'application/json',
        temperature: options.temperature ?? 0.1,
      };

      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }

      if (options.responseSchema) {
        config.responseSchema = options.responseSchema;
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config,
      });

      const responseText = response.text;
      if (!responseText) {
        return null;
      }

      return JSON.parse(responseText) as T;
    } catch (err: any) {
      console.error(`Gemini call error on model ${modelName}:`, err.message);
      return null;
    }
  }
}
