import { NextResponse } from 'next/server';
import { billingService } from '@/features/billing/services/billing.service';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const sale = await billingService.checkout('system', data);
    return NextResponse.json(sale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
