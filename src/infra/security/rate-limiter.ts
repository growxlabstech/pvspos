/**
 * PVS POS Infrastructure V2 — Rate Limiting Security Layer
 */

interface RateLimitConfig {
  maxRequests: number; // Max allowed requests in window
  windowSeconds: number; // Sliding window size in seconds
}

class SlidingWindowRateLimiter {
  private requests = new Map<string, number[]>();

  isAllowed(identifier: string, config: RateLimitConfig): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const timestamps = this.requests.get(identifier) || [];

    // Filter out timestamps older than the sliding window
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length >= config.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    validTimestamps.push(now);
    this.requests.set(identifier, validTimestamps);

    return {
      allowed: true,
      remaining: config.maxRequests - validTimestamps.length,
    };
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();

export const RATE_LIMIT_RULES: Record<string, RateLimitConfig> = {
  AUTH: { maxRequests: 10, windowSeconds: 60 },      // 10 req/min for Login/Auth
  BILLING: { maxRequests: 60, windowSeconds: 60 },   // 60 req/min for Checkout
  SEARCH: { maxRequests: 120, windowSeconds: 60 },   // 120 req/min for Product Search
  AI: { maxRequests: 20, windowSeconds: 60 },         // 20 req/min for Vision/OCR AI
  DEFAULT: { maxRequests: 100, windowSeconds: 60 },  // Default 100 req/min
};
