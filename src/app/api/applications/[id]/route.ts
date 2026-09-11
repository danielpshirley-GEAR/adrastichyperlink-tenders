// src/app/api/applications/[id]/route.ts
import { NextResponse } from 'next/server';
import { getApplicationsRepository } from '@/shared/database/db';
import { requireApiAuth } from '@/shared/auth/require-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Direct route-level authorization guard
  const auth = await requireApiAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

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
