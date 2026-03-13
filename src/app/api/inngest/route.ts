import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { getMetadata } from "@/lib/metadata";
import { revalidatePath } from "next/cache";
import { enrichMetadata } from "@/lib/ai";

const scrapeMetadata = inngest.createFunction(
  { id: "scrape-metadata", name: "Scrape Link Metadata" },
  { event: "link.created" },
  async ({ event, step }) => {
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

    // Step 3: Update database with both metadata and AI results
    await step.run("update-link", async () => {
      await prisma.link.update({
        where: { id: linkId },
        data: {
          title: metadata.title,
          // Use AI summary if available, fallback to original description
          description: aiResult?.summary || metadata.description,
          image: metadata.image,
          // Use AI category if available, maintain original otherwise
          category: aiResult?.category || undefined,
          // Only update URL if we got a canonical one
          url: metadata.url || url,
        },
      });
    });

    // Purge cache for admin and public views
    revalidatePath("/admin");
    revalidatePath("/");

    return { 
      success: true, 
      metadata, 
      aiEnriched: !!aiResult 
    };
  }
);

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scrapeMetadata],
});
