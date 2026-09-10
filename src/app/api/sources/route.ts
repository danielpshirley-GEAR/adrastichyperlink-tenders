// src/app/api/sources/route.ts
import { NextResponse } from 'next/server';
import { SourcesRepository } from '@/shared/database/repositories/sources';

export async function GET() {
  const sources = SourcesRepository.getSources();
  return NextResponse.json({
    count: sources.length,
    sources,
  });
}
