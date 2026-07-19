import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma/client';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const permissions = await prisma.appPermission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    return NextResponse.json(permissions);
  } catch (error: any) {
    console.error('GET /api/permissions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
