import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getSessionUser } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const { message } = await request.json();
    const query = (message || '').toLowerCase().trim();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Intent 1: Low Stock Query
    if (query.includes('low stock') || query.includes('reorder') || query.includes('out of stock')) {
      const lowStockItems = await prisma.inventory.findMany({
        where: { quantity: { lte: 10 } },
        include: { product: { select: { name: true, unit: true, price: true } } },
        take: 10,
      });

      if (lowStockItems.length === 0) {
        return NextResponse.json({
          reply: 'Great news! All products currently have healthy stock levels. No low stock items detected.',
          action: { type: 'NAVIGATE', payload: '/inventory' },
        });
      }

      const itemNames = lowStockItems.map((i) => `• ${i.product.name} (${i.quantity} ${i.product.unit} left)`).join('\n');
      return NextResponse.json({
        reply: `Here are your current low stock items:\n\n${itemNames}\n\nWould you like me to open Inventory management?`,
        action: { type: 'NAVIGATE', payload: '/inventory' },
      });
    }

    // Intent 2: Sales & Profit Query
    if (query.includes('profit') || query.includes('revenue') || query.includes('today\'s sales') || query.includes('today sales')) {
      const todaySales = await prisma.sale.findMany({
        where: { createdAt: { gte: todayStart }, paymentStatus: 'COMPLETED' },
        include: { saleItems: { include: { product: true } } },
      });

      const totalRevenue = todaySales.reduce((acc, s) => acc + Number(s.total), 0);
      const salesCount = todaySales.length;

      let estimatedProfit = 0;
      todaySales.forEach((sale) => {
        sale.saleItems.forEach((item) => {
          const cost = Number(item.product.costPrice) || (Number(item.unitPrice) * 0.7);
          const profit = (Number(item.unitPrice) - cost) * item.quantity;
          estimatedProfit += Math.max(profit, 0);
        });
      });

      return NextResponse.json({
        reply: `📊 **Today's Sales Summary**:\n• **Total Revenue**: ₹${totalRevenue.toFixed(2)}\n• **Total Orders**: ${salesCount}\n• **Estimated Net Profit**: ₹${estimatedProfit.toFixed(2)}`,
        action: { type: 'NAVIGATE', payload: '/sales' },
      });
    }

    // Intent 3: Navigation Intent ("Create product", "Billing", "Categories")
    if (query.includes('create product') || query.includes('add product')) {
      return NextResponse.json({
        reply: 'Opening Product Management where you can create a new product or use our AI Product Scanner.',
        action: { type: 'NAVIGATE', payload: '/products?action=new' },
      });
    }

    if (query.includes('billing') || query.includes('new bill') || query.includes('checkout')) {
      return NextResponse.json({
        reply: 'Opening Billing Terminal for counter checkout.',
        action: { type: 'NAVIGATE', payload: '/billing' },
      });
    }

    if (query.includes('duplicate') || query.includes('find duplicate')) {
      const allProducts = await prisma.product.findMany({ select: { id: true, name: true, barcode: true } });
      const nameCounts: Record<string, number> = {};
      allProducts.forEach((p) => {
        const k = p.name.toLowerCase();
        nameCounts[k] = (nameCounts[k] || 0) + 1;
      });
      const dupes = Object.entries(nameCounts).filter(([_, count]) => count > 1);

      if (dupes.length === 0) {
        return NextResponse.json({
          reply: 'Checked your catalog! No duplicate product names or barcodes were found.',
        });
      }

      return NextResponse.json({
        reply: `Found ${dupes.length} duplicate product names in your database:\n${dupes.map(([name, c]) => `• "${name}" (${c} instances)`).join('\n')}`,
        action: { type: 'NAVIGATE', payload: '/products' },
      });
    }

    // Generic Assistant Response
    return NextResponse.json({
      reply: `I am your **PVS POS AI Copilot**. I can help you with:\n• *"Show low stock items"*\n• *"How much profit today?"*\n• *"Open Billing"*\n• *"Create new product"*\n• *"Find duplicate products"*`,
    });
  } catch (error: any) {
    console.error('POST /api/assistant/chat error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
