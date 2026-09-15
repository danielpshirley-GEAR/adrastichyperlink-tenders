// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { checkDatabaseHealth, getSourcesRepository } from '@/shared/database/db';
import { GeminiClient } from '@/shared/ai/gemini-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  const geminiHealth = await GeminiClient.checkHealth();

  let ftsSource = null;
  let cfSource = null;
  let otherSourcesCount = 5;
  let notImplementedCount = 5;

  try {
    const sourcesRepo = getSourcesRepository();
    const allSources = await sourcesRepo.getAll();
    ftsSource = allSources.find((s) => s.id === 'find_a_tender') || null;
    cfSource = allSources.find((s) => s.id === 'contracts_finder') || null;
    const remaining = allSources.filter((s) => s.id !== 'find_a_tender' && s.id !== 'contracts_finder');
    otherSourcesCount = remaining.length || 5;
    notImplementedCount = remaining.filter((s) => s.healthStatus === 'not_implemented').length || 5;
  } catch {
    // DB unconfigured or probe error
  }

  // 1. Genuine runtime identification
  const isRender = Boolean(process.env.RENDER === 'true');
  const isNetlify = Boolean(
    process.env.NETLIFY === 'true' ||
    process.env.IS_NETLIFY === 'true' ||
    process.env.DEPLOY_ID ||
    process.env.NETLIFY_DEPLOY_ID ||
    (process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.AWS_LAMBDA_FUNCTION_NAME.includes('netlify'))
  );

  const runtime = isRender ? 'Render Web Service' : (isNetlify ? 'Netlify Next.js' : 'Next.js Node.js Server');

  // 2. Genuine commit identification (Strict priority: RENDER_GIT_COMMIT > COMMIT_REF > NEXT_PUBLIC_COMMIT_SHA > BUILD_COMMIT_SHA > VERCEL_GIT_COMMIT_SHA)
  const rawCommit =
    process.env.RENDER_GIT_COMMIT ||
    process.env.COMMIT_REF ||
    process.env.NEXT_PUBLIC_COMMIT_SHA ||
    process.env.BUILD_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA;

  const commit = (rawCommit && rawCommit.trim()) || 'UNKNOWN';

  // 3. Genuine deploy information
  const rawDeployId = process.env.RENDER_SERVICE_ID || process.env.DEPLOY_ID || process.env.NETLIFY_DEPLOY_ID;
  const deployId = (rawDeployId && rawDeployId.trim()) || null;

  const rawDeployContext = isRender
    ? 'render-free'
    : (process.env.CONTEXT || process.env.DEPLOY_CONTEXT);
  const deployContext = (rawDeployContext && rawDeployContext.trim()) || null;

  const rawBranch =
    process.env.RENDER_GIT_BRANCH ||
    process.env.BRANCH ||
    process.env.DEPLOY_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF;
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

  const cfHealth = cfSource?.healthStatus === 'not_implemented' ? 'untested' : (cfSource?.healthStatus || 'untested');
  const cfStatusString = cfHealth === 'healthy'
    ? 'CONTRACTS FINDER — HEALTHY'
    : (cfHealth === 'untested' ? 'CONTRACTS FINDER — UNTESTED' : (cfHealth === 'degraded' ? 'CONTRACTS FINDER — DEGRADED' : 'CONTRACTS FINDER — ERROR'));

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
      status: geminiHealth.status,
      health: geminiHealth.health,
      configured: geminiHealth.configured,
      healthy: geminiHealth.healthy,
      tier1Model: geminiHealth.tier1Model,
      tier3Model: geminiHealth.tier3Model,
      error: geminiHealth.error,
      lastCheckedAt: geminiHealth.lastCheckedAt,
    },
    findATender: {
      status: ftsStatusString,
      health: ftsHealth,
      lastScanAt: ftsSource?.lastSuccessfulScanAt || null,
      noticesChecked: ftsSource?.totalNoticesScanned || 0,
      relevantFound: ftsSource?.totalRelevantFound || 0,
      lastError: ftsSource?.lastScanError || null,
    },
    contractsFinder: {
      status: cfStatusString,
      health: cfHealth,
      lastScanAt: cfSource?.lastSuccessfulScanAt || null,
      noticesChecked: cfSource?.totalNoticesScanned || 0,
      relevantFound: cfSource?.totalRelevantFound || 0,
      lastError: cfSource?.lastScanError || null,
    },
    remainingSources: {
      total: otherSourcesCount,
      notImplemented: notImplementedCount,
      status: 'NOT IMPLEMENTED',
    },
    otherSources: {
      total: otherSourcesCount,
      notImplemented: notImplementedCount,
      status: 'NOT IMPLEMENTED',
    },
    timestamp: new Date().toISOString(),
  });
}
