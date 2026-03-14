import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordVisit } from "@/app/actions/analytics";
import { actionRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  linkId: z.string().min(1),
});

function getClientToken(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0]?.trim() || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  return `${ip}:${ua}`;
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { isRateLimited } = actionRateLimiter.check(120, getClientToken(req));
  if (isRateLimited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const userAgent = req.headers.get("user-agent") || undefined;
  const referrer = req.headers.get("referer") || undefined;
  const country = req.headers.get("x-vercel-ip-country") || undefined;
  const xff = req.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0]?.trim() || undefined;

  await recordVisit(parsed.data.linkId, { userAgent, referrer, country, ip });
  return NextResponse.json({ success: true });
}
