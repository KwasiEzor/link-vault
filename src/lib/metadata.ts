import ogs from "open-graph-scraper";
import DOMPurify from "isomorphic-dompurify";

export type SiteMetadata = {
  title: string;
  description: string | null;
  image: string | null;
  url: string;
};

export async function getMetadata(url: string): Promise<SiteMetadata | null> {
  try {
    const { result } = await ogs({ url });

    const rawTitle = result.ogTitle || result.twitterTitle || result.requestUrl || url;
    const rawDescription = result.ogDescription || result.twitterDescription || null;

    // Sanitize to prevent XSS from scraped content
    return {
      title: DOMPurify.sanitize(rawTitle),
      description: rawDescription ? DOMPurify.sanitize(rawDescription) : null,
      image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
      url: result.ogUrl || url,
    };
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
    return null;
  }
}
