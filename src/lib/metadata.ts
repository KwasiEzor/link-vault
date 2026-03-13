import ogs from "open-graph-scraper";

export type SiteMetadata = {
  title: string;
  description: string | null;
  image: string | null;
  url: string;
};

export async function getMetadata(url: string): Promise<SiteMetadata | null> {
  try {
    const { result } = await ogs({ url });

    return {
      title: result.ogTitle || result.twitterTitle || result.requestUrl || url,
      description: result.ogDescription || result.twitterDescription || null,
      image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
      url: result.ogUrl || url,
    };
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
    return null;
  }
}
