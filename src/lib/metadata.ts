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
    const { result } = await ogs({ url });

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
