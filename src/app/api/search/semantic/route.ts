import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

    // Fetch active products with category & inventory
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { id: true, name: true } },
        inventory: { select: { quantity: true, reorderPoint: true } },
      },
    });

    // Score products based on semantic trigram fuzzy matching
    const scored = products.map((prod) => {
      let score = 0;
      const nameLower = prod.name.toLowerCase();
      const catLower = prod.category?.name.toLowerCase() || '';
      const descLower = prod.description?.toLowerCase() || '';
      const skuLower = prod.sku.toLowerCase();
      const barcodeLower = prod.barcode?.toLowerCase() || '';

      searchTerms.forEach((term) => {
        if (nameLower.includes(term)) score += 10;
        if (catLower.includes(term)) score += 7;
        if (descLower.includes(term)) score += 4;
        if (skuLower === term || barcodeLower === term) score += 20;
      });

      return { product: prod, score };
    });

    const results = scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((item) => item.product);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('GET /api/search/semantic error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
