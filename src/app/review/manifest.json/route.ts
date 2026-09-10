// src/app/review/manifest.json/route.ts
import { NextResponse } from 'next/server';
import { reviewBuildMeta } from '@/modules/public-tenders/review/data';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json(
    {
      environment: reviewBuildMeta.environment,
      buildId: reviewBuildMeta.buildId,
      deployedAt: reviewBuildMeta.deployedAt,
      routes: [
        '/review/today',
        '/review/tenders',
        '/review/applications',
        '/review/scan',
        '/review/knowledge',
        '/review/settings',
        '/review/content',
        '/review/manifest.json',
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    }
  );
}
