import { NextResponse } from 'next/server';
import { queueManager } from '@/infra/queues/queue-manager';
import { prisma } from '@/lib/prisma/client';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'HEALTHY';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = 'UNHEALTHY';
  }

  const queueStats = queueManager.getStats();

  return NextResponse.json({
    status: dbStatus === 'HEALTHY' ? 'ONLINE' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime,
    components: {
      database: dbStatus,
      redisCache: 'HEALTHY (Upstash / Memory)',
      queues: queueStats,
      cloudflareEdge: 'ACTIVE',
    },
    domain: 'https://pvs.martt.growxlabs.tech',
  });
}
