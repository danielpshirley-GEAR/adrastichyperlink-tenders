// src/app/api/tenders/route.ts
import { NextResponse } from 'next/server';
import { TendersRepository } from '@/shared/database/repositories/tenders';

export async function GET() {
  const tenders = await TendersRepository.getAll();
  return NextResponse.json({
    total: tenders.length,
    tenders,
  });
}
