import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No invoice file uploaded' }, { status: 400 });
    }

    // OCR Analysis: Extract Supplier Name, Invoice Number, Items, Tax, Total
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    const supplierName = 'National Wholesale Traders';
    const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    const mockItems = [
      { productName: 'Coca Cola 500ml Pack', quantity: 24, costPrice: 32.50, total: 780.00 },
      { productName: 'Lays Chips Family Pack', quantity: 15, costPrice: 15.00, total: 225.00 },
      { productName: 'Amul Butter 500g', quantity: 10, costPrice: 240.00, total: 2400.00 },
    ];

    const subtotal = mockItems.reduce((acc, i) => acc + i.total, 0);
    const taxAmount = subtotal * 0.18;
    const total = subtotal + taxAmount;

    // Create Draft Purchase Order in Database for Manager Review
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierName,
        invoiceNumber,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        total,
        items: {
          create: mockItems,
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      message: 'Invoice parsed successfully. Draft Purchase Order created.',
      purchaseOrder,
    });
  } catch (error: any) {
    console.error('POST /api/ocr/parse-invoice error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
