// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/shared/database/db';
import { GeminiClient } from '@/shared/ai/gemini-client';
import { SourcesRepository } from '@/shared/database/repositories/sources';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbHealth = checkDatabaseHealth();
  const geminiConfigured = GeminiClient.isConfigured();
  const ftsSource = SourcesRepository.getById('find_a_tender');
  const allSources = SourcesRepository.getAll();

  const otherSourcesCount = allSources.filter((s) => s.id !== 'find_a_tender').length;
  const notImplementedCount = allSources.filter((s) => s.healthStatus === 'not_implemented').length;

  return NextResponse.json({
    database: {
      status: dbHealth.healthy ? 'DATABASE CONNECTED' : 'DATABASE NOT CONFIGURED',
      healthy: dbHealth.healthy,
      type: dbHealth.type,
      totalTenders: dbHealth.totalTenders,
      totalSources: dbHealth.totalSources,
    },
    gemini: {
      status: geminiConfigured ? 'GEMINI CONFIGURED' : 'GEMINI NOT CONFIGURED',
      configured: geminiConfigured,
      tier1Model: GeminiClient.getModelForTier(1),
      tier3Model: GeminiClient.getModelForTier(3),
    },
    findATender: {
      status: ftsSource?.healthStatus === 'healthy' ? 'FIND A TENDER — HEALTHY' : 'FIND A TENDER — DEGRADED',
      health: ftsSource?.healthStatus || 'healthy',
      lastScanAt: ftsSource?.lastSuccessfulScanAt,
      noticesChecked: ftsSource?.totalNoticesScanned || 0,
      relevantFound: ftsSource?.totalRelevantFound || 0,
    },
    otherSources: {
      total: otherSourcesCount,
      notImplemented: notImplementedCount,
      status: 'NOT IMPLEMENTED',
    },
    timestamp: new Date().toISOString(),
  });
}
