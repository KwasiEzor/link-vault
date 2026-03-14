import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000, // 60 seconds
  });

  return {
    check: (limit: number, token: string) => {
      const current = (tokenCache.get(token) as number | undefined) ?? 0;
      const next = current + 1;
      tokenCache.set(token, next);

      // Semantics: allow exactly `limit` requests in the interval, block on (limit + 1).
      const isRateLimited = next > limit;

      return {
        isRateLimited,
        currentUsage: next,
        limit,
      };
    },
  };
}

// Global instances for specific use cases
export const metadataRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export const actionRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});
