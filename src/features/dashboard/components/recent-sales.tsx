'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface Sale {
  id: string;
  invoiceNumber: string;
  total: number | string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string | Date;
  _count: { saleItems: number };
}

interface RecentSalesProps {
  sales: Sale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  if (sales.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No sales yet. Start billing to see your sales here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{sale.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {sale._count.saleItems} item{sale._count.saleItems !== 1 ? 's' : ''} •{' '}
                    {formatRelativeTime(sale.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={sale.paymentMethod === 'CASH' ? 'secondary' : 'outline'}>
                    {sale.paymentMethod}
                  </Badge>
                  <span className="text-sm font-semibold">
                    {formatCurrency(Number(sale.total))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
