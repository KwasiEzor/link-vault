import ogs from "open-graph-scraper";
import DOMPurify from "isomorphic-dompurify";
import { assertSafeUrl, safeUrlOrNull } from "./url-safety";

export type SiteMetadata = {
  title: string;
  description: string | null;
  image: string | null;
  url: string;
};

export async function getMetadata(url: string): Promise<SiteMetadata | null> {
  try {
    await assertSafeUrl(url);
    const { result } = await ogs({
      url,
      timeout: 5, // seconds
      fetchOptions: {
        redirect: "follow",
        headers: {
          // Helps with sites that block unknown/bot UAs.
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
        },
      },
    });

    const rawTitle = result.ogTitle || result.twitterTitle || result.requestUrl || url;
    const rawDescription = result.ogDescription || result.twitterDescription || null;
    const rawImage = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null;

    const safeImage = await safeUrlOrNull(rawImage);
    const candidateCanonicalUrl = result.ogUrl || result.requestUrl || url;
    const safeCanonicalUrl = (await safeUrlOrNull(candidateCanonicalUrl)) || url;

    // Sanitize to prevent XSS from scraped content
    return {
      title: DOMPurify.sanitize(rawTitle),
      description: rawDescription ? DOMPurify.sanitize(rawDescription) : null,
      image: safeImage,
      url: safeCanonicalUrl,
    };
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
    return null;
  }
}
