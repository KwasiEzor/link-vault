import { NextRequest, NextResponse } from "next/server";
import { getMetadata } from "@/lib/metadata";
import { auth } from "@/auth";
import { metadataRateLimiter } from "@/lib/rate-limit";
import { assertSafeUrl } from "@/lib/url-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limiting (10 requests per minute per user)
    const { isRateLimited } = metadataRateLimiter.check(10, session.user.id);
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
          }
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      await assertSafeUrl(url);
    } catch (error) {
      console.warn("Blocked unsafe URL:", error);
      return NextResponse.json({ error: "URL is not allowed" }, { status: 400 });
    }

    try {
      const metadata = await getMetadata(url);
      if (!metadata) {
        return NextResponse.json({ error: "Could not fetch metadata" }, { status: 404 });
      }
      return NextResponse.json(metadata);
    } catch (error) {
      console.error("Metadata handler error:", error);
      return NextResponse.json({ error: "Internal Server Error", code: "METADATA_HANDLER_ERROR" }, { status: 500 });
    }
  } catch (error) {
    // Catch-all: prevents Next.js from returning an HTML 500 page.
    console.error("Metadata route fatal error:", error);
    return NextResponse.json({ error: "Internal Server Error", code: "METADATA_ROUTE_FATAL" }, { status: 500 });
  }
}
