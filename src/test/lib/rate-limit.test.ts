import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows exactly `limit` requests, blocks on limit+1", () => {
    const rl = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 10 });
    const token = "user-1";

    expect(rl.check(3, token)).toEqual({ isRateLimited: false, currentUsage: 1, limit: 3 });
    expect(rl.check(3, token)).toEqual({ isRateLimited: false, currentUsage: 2, limit: 3 });
    expect(rl.check(3, token)).toEqual({ isRateLimited: false, currentUsage: 3, limit: 3 });
    expect(rl.check(3, token)).toEqual({ isRateLimited: true, currentUsage: 4, limit: 3 });
  });
});

