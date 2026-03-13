import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { getMetadata } from "@/lib/metadata";
import { revalidatePath } from "next/cache";

const scrapeMetadata = inngest.createFunction(
  { id: "scrape-metadata", name: "Scrape Link Metadata" },
  { event: "link.created" },
  async ({ event, step }) => {
    const { linkId, url } = event.data;

    const metadata = await step.run("fetch-metadata", async () => {
      return await getMetadata(url);
    });

    if (metadata) {
      await step.run("update-link", async () => {
        await prisma.link.update({
          where: { id: linkId },
          data: {
            title: metadata.title,
            description: metadata.description,
            image: metadata.image,
            // Only update URL if we got a canonical one
            url: metadata.url || url,
          },
        });
      });

      // Purge cache for admin and public views
      revalidatePath("/admin");
      revalidatePath("/");
    }

    return { success: !!metadata, metadata };
  }
);

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scrapeMetadata],
});
