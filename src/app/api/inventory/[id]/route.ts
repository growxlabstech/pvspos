import { NextResponse } from 'next/server';
import { inventoryService } from '@/features/inventory/services/inventory.service';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await _request.json();
    const { quantity } = body;

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    const item = await inventoryService.restock(id, quantity);
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: 'Failed to restock inventory' }, { status: 500 });
  }
}
