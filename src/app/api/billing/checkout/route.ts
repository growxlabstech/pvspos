import { NextResponse } from 'next/server';
import { billingService } from '@/features/billing/services/billing.service';
import { getSessionUser } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const sale = await billingService.checkout(user.userId, data);
    return NextResponse.json(sale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

