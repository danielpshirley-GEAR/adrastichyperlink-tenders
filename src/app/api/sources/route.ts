// src/app/api/sources/route.ts
import { NextResponse } from 'next/server';
import { getSourcesRepository } from '@/shared/database/db';
import { requireApiAuth } from '@/shared/auth/require-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Direct route-level authorization guard
  const auth = await requireApiAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    const sourcesRepo = getSourcesRepository();
    const sources = await sourcesRepo.getAll();
    const activeSources = sources.filter((s) => s.isActive);
    const healthySources = sources.filter((s) => s.healthStatus === 'healthy');

    return NextResponse.json({
      count: sources.length,
      activeCount: activeSources.length,
      healthyCount: healthySources.length,
      sources,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch sources', message: err.message }, { status: 500 });
  }
}
