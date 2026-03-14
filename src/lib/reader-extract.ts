import { parse } from "node-html-parser";
import { assertSafeUrl } from "@/lib/url-safety";

export type ReaderExtract = {
  title: string | null;
  text: string;
  excerpt: string | null;
  wordCount: number;
};

function normalizeText(input: string) {
  return input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(s: string, max: number) {
  return s.length > max ? s.slice(0, max) : s;
}

export async function fetchAndExtractReadableText(url: string): Promise<ReaderExtract> {
  await assertSafeUrl(url);

  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(7000),
    // Don't cache remote HTML in serverless.
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status})`);
  }
  if (!contentType.includes("text/html")) {
    throw new Error("Unsupported content type");
  }

  const html = await res.text();
  const root = parse(html);

  // Remove noisy nodes.
  root.querySelectorAll("script,style,noscript,svg,canvas,iframe,form,nav,footer,header").forEach((n) => n.remove());

  const title =
    normalizeText(root.querySelector("meta[property='og:title']")?.getAttribute("content") || "") ||
    normalizeText(root.querySelector("title")?.text || "") ||
    null;

  // Prefer semantic containers if present.
  const main =
    root.querySelector("article") ||
    root.querySelector("main") ||
    root.querySelector("[role='main']") ||
    root.querySelector(".post") ||
    root.querySelector(".article") ||
    root.querySelector("body") ||
    root;

  const paragraphs = main
    .querySelectorAll("p")
    .map((p) => normalizeText(p.text))
    .filter((p) => p.length >= 40);

  const rawText = paragraphs.length > 0 ? paragraphs.join("\n\n") : normalizeText(main.text);
  const clamped = clamp(rawText, 150_000);
  const words = clamped ? clamped.split(" ").filter(Boolean).length : 0;
  const excerpt = clamped ? clamp(clamped, 280) : null;

  return {
    title,
    text: clamped,
    excerpt,
    wordCount: words,
  };
}
