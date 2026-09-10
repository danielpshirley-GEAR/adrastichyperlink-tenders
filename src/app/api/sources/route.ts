// src/app/api/sources/route.ts
import { NextResponse } from 'next/server';
import { SourcesRepository } from '@/shared/database/repositories/sources';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sources = SourcesRepository.getAll();
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
