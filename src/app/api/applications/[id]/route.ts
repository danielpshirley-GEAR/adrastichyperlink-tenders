// src/app/api/applications/[id]/route.ts
import { NextResponse } from 'next/server';
import { getApplicationsRepository } from '@/shared/database/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const applicationsRepo = getApplicationsRepository();
    const id = params.id;
    const application = await applicationsRepo.getById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch application', message: err.message }, { status: 500 });
  }
}
