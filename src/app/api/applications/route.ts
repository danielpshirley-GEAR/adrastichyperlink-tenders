// src/app/api/applications/route.ts
import { NextResponse } from 'next/server';
import { ApplicationsRepository } from '@/shared/database/repositories/applications';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const applications = await ApplicationsRepository.getAll();
    return NextResponse.json({
      total: applications.length,
      applications,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch applications', message: err.message }, { status: 500 });
  }
}
