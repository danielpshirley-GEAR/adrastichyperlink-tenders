// src/shared/ai/gemini-client.ts
import { GoogleGenAI } from '@google/genai';

export type GeminiFailureCategory =
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'SCHEMA_VALIDATION'
  | 'INVALID_JSON'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface GeminiCallOptions {
  tier: 1 | 2 | 3 | 4;
  systemInstruction?: string;
  temperature?: number;
  responseSchema?: Record<string, any>;
}

export interface GeminiCallResult<T> {
  success: boolean;
  data?: T;
  rawText?: string;
  errorCategory?: GeminiFailureCategory;
  errorMessage?: string;
  attempts: number;
}

export function cleanJsonString(raw: string): string {
  let text = raw.trim();
  // Strip markdown code fences like ```json ... ``` or ``` ... ```
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '');
    text = text.replace(/\s*```$/, '');
  }
  // Extract JSON between first '{' and last '}'
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }
  return text.trim();
}

export function categorizeGeminiError(err: any): GeminiFailureCategory {
  const msg = (err?.message || String(err)).toLowerCase();
  const status = err?.status || err?.statusCode || err?.code;

  if (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  ) {
    return 'RATE_LIMIT';
  }
  if (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('aborterror') ||
    msg.includes('etimedout')
  ) {
    return 'TIMEOUT';
  }
  if (
    err instanceof SyntaxError ||
    msg.includes('unexpected token') ||
    msg.includes('json') ||
    msg.includes('syntaxerror')
  ) {
    return 'INVALID_JSON';
  }
  if (
    msg.includes('fetch failed') ||
    msg.includes('econnreset') ||
    msg.includes('enotfound') ||
    msg.includes('network')
  ) {
    return 'NETWORK_ERROR';
  }
  if (
    status === 500 ||
    status === 503 ||
    msg.includes('500') ||
    msg.includes('503') ||
    msg.includes('internal') ||
    msg.includes('googlegenai')
  ) {
    return 'API_ERROR';
  }
  return 'UNKNOWN';
}

export type GeminiHealthState =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED_UNTESTED'
  | 'HEALTHY'
  | 'INVALID_KEY'
  | 'RATE_LIMITED'
  | 'ERROR';

export interface GeminiHealthReport {
  status: string;
  health: GeminiHealthState;
  configured: boolean;
  healthy: boolean;
  tier1Model: string;
  tier3Model: string;
  error: string | null;
  lastCheckedAt: string;
}

export class GeminiClient {
  private static healthCache: GeminiHealthReport | null = null;
  private static healthCacheExpiresAt = 0;

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

  static async checkHealth(forceRefresh = false): Promise<GeminiHealthReport> {
    const now = Date.now();
    if (!forceRefresh && this.healthCache && now < this.healthCacheExpiresAt) {
      return this.healthCache;
    }

    const tier1Model = this.getModelForTier(1);
    const tier3Model = this.getModelForTier(3);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const report: GeminiHealthReport = {
        status: 'GEMINI NOT CONFIGURED',
        health: 'NOT_CONFIGURED',
        configured: false,
        healthy: false,
        tier1Model,
        tier3Model,
        error: null,
        lastCheckedAt: new Date().toISOString(),
      };
      this.healthCache = report;
      this.healthCacheExpiresAt = now + 60000;
      return report;
    }

    const ai = this.getClient();
    if (!ai) {
      const report: GeminiHealthReport = {
        status: 'GEMINI ERROR',
        health: 'ERROR',
        configured: true,
        healthy: false,
        tier1Model,
        tier3Model,
        error: 'Failed to initialize Gemini client',
        lastCheckedAt: new Date().toISOString(),
      };
      this.healthCache = report;
      this.healthCacheExpiresAt = now + 60000;
      return report;
    }

    try {
      const callPromise = ai.models.generateContent({
        model: tier1Model,
        contents: 'ping',
        config: {
          maxOutputTokens: 1,
          temperature: 0.1,
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini health probe timed out after 7s')), 7000)
      );

      await Promise.race([callPromise, timeoutPromise]);

      const report: GeminiHealthReport = {
        status: 'GEMINI HEALTHY',
        health: 'HEALTHY',
        configured: true,
        healthy: true,
        tier1Model,
        tier3Model,
        error: null,
        lastCheckedAt: new Date().toISOString(),
      };
      this.healthCache = report;
      this.healthCacheExpiresAt = now + 300000; // 5 min TTL
      return report;
    } catch (err: any) {
      const msg = (err?.message || String(err)).toLowerCase();
      let healthState: GeminiHealthState = 'ERROR';
      let statusStr = 'GEMINI ERROR';
      let cleanError = 'Gemini service unreachable';

      if (
        msg.includes('api_key_invalid') ||
        msg.includes('api key not valid') ||
        msg.includes('invalid_argument') ||
        msg.includes('key not valid') ||
        msg.includes('400')
      ) {
        healthState = 'INVALID_KEY';
        statusStr = 'GEMINI INVALID KEY';
        cleanError = 'Invalid API key configured';
      } else if (
        msg.includes('quota') ||
        msg.includes('429') ||
        msg.includes('resource_exhausted') ||
        msg.includes('rate limit')
      ) {
        healthState = 'RATE_LIMITED';
        statusStr = 'GEMINI RATE LIMITED';
        cleanError = 'Gemini API quota exceeded';
      }

      const report: GeminiHealthReport = {
        status: statusStr,
        health: healthState,
        configured: true,
        healthy: false,
        tier1Model,
        tier3Model,
        error: cleanError,
        lastCheckedAt: new Date().toISOString(),
      };
      this.healthCache = report;
      this.healthCacheExpiresAt = now + 120000; // 2 min cache on error
      return report;
    }
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

  static async generateJsonWithDiagnostics<T>(
    prompt: string,
    options: GeminiCallOptions,
    maxAttempts = 3
  ): Promise<GeminiCallResult<T>> {
    const ai = this.getClient();
    if (!ai) {
      return {
        success: false,
        errorCategory: 'API_ERROR',
        errorMessage: 'Gemini client not configured (GEMINI_API_KEY missing)',
        attempts: 0,
      };
    }

    const modelName = this.getModelForTier(options.tier);
    let lastErrorCategory: GeminiFailureCategory = 'UNKNOWN';
    let lastErrorMessage = '';
    let rawResponseText = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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

        // Bounded call with 25s timeout
        const callPromise = ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini request timed out after 25s on attempt ${attempt}`)), 25000)
        );

        const response: any = await Promise.race([callPromise, timeoutPromise]);
        const text = response?.text;

        if (!text) {
          throw new Error('Gemini returned empty response text');
        }

        rawResponseText = text;
        const cleaned = cleanJsonString(text);
        const parsed = JSON.parse(cleaned) as T;

        return {
          success: true,
          data: parsed,
          rawText: rawResponseText,
          attempts: attempt,
        };
      } catch (err: any) {
        lastErrorCategory = categorizeGeminiError(err);
        lastErrorMessage = err?.message || String(err);
        console.warn(
          `[Gemini Retry ${attempt}/${maxAttempts}] Model: ${modelName} | Category: ${lastErrorCategory} | Error: ${lastErrorMessage}`
        );

        if (attempt < maxAttempts) {
          // Attempt 1 -> short backoff (1500ms), Attempt 2 -> longer backoff (3500ms)
          const backoffMs = attempt === 1 ? 1500 : 3500;
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    return {
      success: false,
      rawText: rawResponseText,
      errorCategory: lastErrorCategory,
      errorMessage: lastErrorMessage,
      attempts: maxAttempts,
    };
  }

  static async generateJson<T>(prompt: string, options: GeminiCallOptions): Promise<T | null> {
    const result = await this.generateJsonWithDiagnostics<T>(prompt, options);
    return result.success && result.data ? result.data : null;
  }
}
