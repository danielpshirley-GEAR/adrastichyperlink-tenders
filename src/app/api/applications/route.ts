// src/app/api/applications/route.ts
import { NextResponse } from 'next/server';
import { getApplicationsRepository } from '@/shared/database/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const applicationsRepo = getApplicationsRepository();
    const applications = await applicationsRepo.getAll();
    return NextResponse.json({
      total: applications.length,
      applications,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch applications', message: err.message }, { status: 500 });
  }
}
