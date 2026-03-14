import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { getMetadata } from "@/lib/metadata";
import { revalidatePath } from "next/cache";
import { enrichMetadata } from "@/lib/ai";
import { getSetting } from "@/lib/settings";
import { assertSafeUrl, safeUrlOrNull } from "@/lib/url-safety";
import { fetchAndExtractReadableText } from "@/lib/reader-extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const scrapeMetadata = inngest.createFunction(
  { id: "scrape-metadata", name: "Scrape Link Metadata" },
  { event: "link.created" },
  async ({ event, step }) => {
    const isEnabled = await step.run("check-settings", async () => {
      return await getSetting("METADATA_SCRAPING_ENABLED", true);
    });

    if (!isEnabled) {
      return { skipped: true, reason: "Metadata scraping is disabled in settings." };
    }

    const { linkId, url } = event.data;

    // Step 1: Scrape basic metadata
    const metadata = await step.run("fetch-metadata", async () => {
      return await getMetadata(url);
    });

    if (!metadata) return { success: false };

    // Step 2: Enrich with AI (Categorization & Summary)
    const aiResult = await step.run("ai-enrichment", async () => {
      return await enrichMetadata(metadata.title, metadata.description, url);
    });

    // Step 3: Update database with both metadata and AI results (Suggestions)
    await step.run("update-link", async () => {
      const safeImage = await safeUrlOrNull(metadata.image);
      const safeCanonicalUrl = (await safeUrlOrNull(metadata.url)) || url;
      let domain: string | null = null;
      try {
        domain = new URL(safeCanonicalUrl).hostname.replace(/^www\./, "");
      } catch {
        domain = null;
      }
      await prisma.link.update({
        where: { id: linkId },
        data: {
          title: metadata.title,
          // Save original metadata
          description: metadata.description,
          image: safeImage,
          // Save AI suggestions separately
          aiSummary: aiResult?.summary,
          aiCategory: aiResult?.category,
          enrichmentStatus: aiResult ? "completed" : "failed",
          // Only update URL if we got a canonical one
          url: safeCanonicalUrl,
          canonicalUrl: safeCanonicalUrl,
          domain,
          lastMetadataAt: new Date(),
        },
      });
    });

    // Purge cache
    revalidatePath("/admin");
    revalidatePath("/admin/curation");
    revalidatePath("/admin/settings");
    revalidatePath("/");

    // Fan-out: trigger health check
    await step.sendEvent("trigger-health-check", {
      name: "link.health_check",
      data: { linkId, url },
    });

    return { 
      success: true, 
      metadata, 
      aiEnriched: !!aiResult 
    };
  }
);

const checkLinkHealth = inngest.createFunction(
  { id: "check-link-health", name: "Check Link Health" },
  { event: "link.health_check" },
  async ({ event, step }) => {
    const isEnabled = await step.run("check-settings", async () => {
      return await getSetting("HEALTH_CHECK_ENABLED", true);
    });

    if (!isEnabled) {
      return { skipped: true, reason: "Health checks are disabled in settings." };
    }

    const { linkId, url } = event.data;

    // Extra guard: never fetch local/private resources.
    try {
      await assertSafeUrl(url);
    } catch (error) {
      console.warn("Health check blocked unsafe URL:", error);
      await step.run("update-status", async () => {
        await prisma.link.update({
          where: { id: linkId },
          data: { status: "broken" },
        });
      });
      return { skipped: true, reason: "URL blocked by safety checks", linkId, url };
    }

    const isAlive = await step.run("ping-url", async () => {
      try {
        const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
        return res.ok;
      } catch {
        return false;
      }
    });

    await step.run("update-status", async () => {
      await prisma.link.update({
        where: { id: linkId },
        data: {
          status: isAlive ? "active" : "broken",
        },
      });
    });

    return { linkId, url, isAlive };
  }
);

const archiveLink = inngest.createFunction(
  { id: "archive-link", name: "Archive Link Snapshot" },
  { event: "link.archive.requested" },
  async ({ event, step }) => {
    const { linkId, url } = event.data;

    try {
      const extract = await step.run("extract-readable", async () => {
        return await fetchAndExtractReadableText(url);
      });

      await step.run("update-link-archive", async () => {
        await prisma.link.update({
          where: { id: linkId },
          data: {
            archive: {
              status: "completed",
              archivedAt: new Date().toISOString(),
              title: extract.title,
              excerpt: extract.excerpt,
              wordCount: extract.wordCount,
              text: extract.text,
            },
          },
        });
      });

      revalidatePath("/admin");
      revalidatePath("/admin/curation");
      revalidatePath("/");

      return { success: true, linkId, archived: true, wordCount: extract.wordCount };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Archive failed";
      await step.run("mark-archive-failed", async () => {
        await prisma.link.update({
          where: { id: linkId },
          data: {
            archive: {
              status: "failed",
              error: message,
              failedAt: new Date().toISOString(),
            },
          },
        });
      });
      throw error;
    }
  }
);

const handlers = serve({
  client: inngest,
  functions: [scrapeMetadata, checkLinkHealth, archiveLink],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

function ensureInngestConfigured() {
  if (process.env.NODE_ENV === "production" && !process.env.INNGEST_SIGNING_KEY) {
    return NextResponse.json(
      { error: "Inngest is not configured: missing INNGEST_SIGNING_KEY" },
      { status: 500 }
    );
  }
  return null;
}

export async function GET(req: NextRequest, ctx: unknown) {
  const fail = ensureInngestConfigured();
  if (fail) return fail;
  return handlers.GET(req, ctx as never);
}

export async function POST(req: NextRequest, ctx: unknown) {
  const fail = ensureInngestConfigured();
  if (fail) return fail;
  return handlers.POST(req, ctx as never);
}

export async function PUT(req: NextRequest, ctx: unknown) {
  const fail = ensureInngestConfigured();
  if (fail) return fail;
  return handlers.PUT(req, ctx as never);
}
