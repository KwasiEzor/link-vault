import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { getMetadata } from "@/lib/metadata";
import { revalidatePath } from "next/cache";
import { enrichMetadata } from "@/lib/ai";
import { getSetting } from "@/lib/settings";

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
      await prisma.link.update({
        where: { id: linkId },
        data: {
          title: metadata.title,
          // Save original metadata
          description: metadata.description,
          image: metadata.image,
          // Save AI suggestions separately
          aiSummary: aiResult?.summary,
          aiCategory: aiResult?.category,
          enrichmentStatus: aiResult ? "completed" : "failed",
          // Only update URL if we got a canonical one
          url: metadata.url || url,
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

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scrapeMetadata, checkLinkHealth],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
