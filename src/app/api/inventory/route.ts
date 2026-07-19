import { NextResponse } from 'next/server';
import { inventoryService } from '@/features/inventory/services/inventory.service';

export async function GET() {
  try {
    const inventory = await inventoryService.getAll();
    return NextResponse.json(inventory);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}
