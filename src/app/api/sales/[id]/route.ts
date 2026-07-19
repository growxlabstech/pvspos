import { NextResponse } from 'next/server';
import { salesService } from '@/features/sales/services/sales.service';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const sale = await salesService.getById(id);
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }
    return NextResponse.json(sale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
