import { NextResponse } from 'next/server';
import { productService } from '@/features/products/services/product.service';
import { createProductSchema } from '@/features/products/schemas/product.schema';
import { verifyPermission } from '@/lib/auth/rbac';

export async function GET(req: Request) {
  try {
    const verified = await verifyPermission('PRODUCTS_VIEW');
    if (!verified) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;

    const products = await productService.list({ search });
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const verified = await verifyPermission('PRODUCTS_CREATE');
    if (!verified) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = createProductSchema.parse(body);
    
    const product = await productService.create(validatedData);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

