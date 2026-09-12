// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { checkDatabaseHealth, getSourcesRepository } from '@/shared/database/db';
import { GeminiClient } from '@/shared/ai/gemini-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  const geminiConfigured = GeminiClient.isConfigured();

  let ftsSource = null;
  let otherSourcesCount = 6;
  let notImplementedCount = 6;

  try {
    const sourcesRepo = getSourcesRepository();
    const allSources = await sourcesRepo.getAll();
    ftsSource = allSources.find((s) => s.id === 'find_a_tender') || null;
    otherSourcesCount = allSources.filter((s) => s.id !== 'find_a_tender').length;
    notImplementedCount = allSources.filter((s) => s.healthStatus === 'not_implemented').length;
  } catch {
    // DB unconfigured or probe error
  }

  // 1. Genuine runtime identification
  const isNetlify = Boolean(
    process.env.NETLIFY === 'true' ||
    process.env.IS_NETLIFY === 'true' ||
    process.env.DEPLOY_ID ||
    process.env.NETLIFY_DEPLOY_ID ||
    (process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.AWS_LAMBDA_FUNCTION_NAME.includes('netlify'))
  );

  const runtime = isNetlify ? 'Netlify Next.js' : 'Next.js Node.js Server';

  // 2. Genuine commit identification (Strict priority: COMMIT_REF > NEXT_PUBLIC_COMMIT_SHA > BUILD_COMMIT_SHA > VERCEL_GIT_COMMIT_SHA)
  const rawCommit =
    process.env.COMMIT_REF ||
    process.env.NEXT_PUBLIC_COMMIT_SHA ||
    process.env.BUILD_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA;

  const commit = (rawCommit && rawCommit.trim()) || 'UNKNOWN';

  // 3. Genuine deploy information
  const rawDeployId = process.env.DEPLOY_ID || process.env.NETLIFY_DEPLOY_ID;
  const deployId = (rawDeployId && rawDeployId.trim()) || null;

  const rawDeployContext = process.env.CONTEXT || process.env.DEPLOY_CONTEXT;
  const deployContext = (rawDeployContext && rawDeployContext.trim()) || null;

  const rawBranch = process.env.BRANCH || process.env.DEPLOY_BRANCH || process.env.VERCEL_GIT_COMMIT_REF;
  const branch = (rawBranch && rawBranch.trim()) || null;

  const dbStatusString = dbHealth.healthy
    ? 'DATABASE CONNECTED'
    : (process.env.NODE_ENV === 'production' && !dbHealth.configured
        ? 'PRODUCTION DATABASE NOT CONFIGURED'
        : 'DATABASE NOT CONFIGURED');

  const dbTypeString = dbHealth.type === 'postgres'
    ? 'Supabase PostgreSQL'
    : (dbHealth.type === 'sqlite' ? 'SQLite' : 'None');

  const ftsHealth = ftsSource?.healthStatus || 'untested';
  const ftsStatusString = ftsHealth === 'healthy'
    ? 'FIND A TENDER — HEALTHY'
    : (ftsHealth === 'untested' ? 'FIND A TENDER — UNTESTED' : (ftsHealth === 'degraded' ? 'FIND A TENDER — DEGRADED' : 'FIND A TENDER — ERROR'));

  return NextResponse.json({
    runtime,
    commit,
    deployId,
    deployContext,
    branch,
    database: {
      status: dbStatusString,
      type: dbTypeString,
      engine: dbHealth.type,
      configured: dbHealth.configured,
      reachable: dbHealth.healthy,
      healthy: dbHealth.healthy,
      totalTenders: dbHealth.totalTenders,
      totalSources: dbHealth.totalSources,
      error: dbHealth.error,
    },
    gemini: {
      status: geminiConfigured ? 'GEMINI CONFIGURED' : 'GEMINI NOT CONFIGURED',
      configured: geminiConfigured,
      tier1Model: GeminiClient.getModelForTier(1),
      tier3Model: GeminiClient.getModelForTier(3),
    },
    findATender: {
      status: ftsStatusString,
      health: ftsHealth,
      lastScanAt: ftsSource?.lastSuccessfulScanAt || null,
      noticesChecked: ftsSource?.totalNoticesScanned || 0,
      relevantFound: ftsSource?.totalRelevantFound || 0,
      lastError: ftsSource?.lastScanError || null,
    },
    otherSources: {
      total: otherSourcesCount,
      notImplemented: notImplementedCount,
      status: 'NOT IMPLEMENTED',
    },
    timestamp: new Date().toISOString(),
  });
}
