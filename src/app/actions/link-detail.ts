"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { actionRateLimiter } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateLinkInsights } from "@/lib/ai";
import { inngest } from "@/lib/inngest";
import { fetchAndExtractReadableText } from "@/lib/reader-extract";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export type LinkNote = { id: string; body: string; createdAt: string; updatedAt: string };
export type LinkHighlight = { id: string; quote: string; note?: string; createdAt: string };
export type LinkInsights = {
  summary: string;
  keyTakeaways: string[];
  topics: string[];
  entities: string[];
  suggestedTags: string[];
  updatedAt?: string;
};
export type LinkArchive = {
  status: "idle" | "pending" | "completed" | "failed" | string;
  requestedAt?: string;
  archivedAt?: string;
  failedAt?: string;
  title?: string | null;
  excerpt?: string | null;
  wordCount?: number;
  text?: string;
  error?: string;
};

function asObjectArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is Record<string, unknown> => !!v && typeof v === "object");
}

function asNotes(value: unknown): LinkNote[] {
  return asObjectArray(value)
    .map((n) => ({
      id: typeof n.id === "string" ? n.id : "",
      body: typeof n.body === "string" ? n.body : "",
      createdAt: typeof n.createdAt === "string" ? n.createdAt : new Date().toISOString(),
      updatedAt: typeof n.updatedAt === "string" ? n.updatedAt : new Date().toISOString(),
    }))
    .filter((n) => n.id && n.body);
}

function asHighlights(value: unknown): LinkHighlight[] {
  return asObjectArray(value)
    .map((h) => ({
      id: typeof h.id === "string" ? h.id : "",
      quote: typeof h.quote === "string" ? h.quote : "",
      note: typeof h.note === "string" ? h.note : undefined,
      createdAt: typeof h.createdAt === "string" ? h.createdAt : new Date().toISOString(),
    }))
    .filter((h) => h.id && h.quote);
}

function asInsights(value: unknown): LinkInsights | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const summary = typeof v.summary === "string" ? v.summary : "";
  if (!summary) return null;
  return {
    summary,
    keyTakeaways: asStringArray(v.keyTakeaways),
    topics: asStringArray(v.topics),
    entities: asStringArray(v.entities),
    suggestedTags: asStringArray(v.suggestedTags),
    updatedAt: typeof v.updatedAt === "string" ? v.updatedAt : undefined,
  };
}

function asArchive(value: unknown): LinkArchive | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const status = typeof v.status === "string" ? v.status : "idle";
  return {
    status,
    requestedAt: typeof v.requestedAt === "string" ? v.requestedAt : undefined,
    archivedAt: typeof v.archivedAt === "string" ? v.archivedAt : undefined,
    failedAt: typeof v.failedAt === "string" ? v.failedAt : undefined,
    title: typeof v.title === "string" ? v.title : null,
    excerpt: typeof v.excerpt === "string" ? v.excerpt : null,
    wordCount: typeof v.wordCount === "number" ? v.wordCount : undefined,
    text: typeof v.text === "string" ? v.text : undefined,
    error: typeof v.error === "string" ? v.error : undefined,
  };
}

async function requireOwner(linkId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const { isRateLimited } = actionRateLimiter.check(30, session.user.id);
  if (isRateLimited) throw new Error("Too many actions. Please try again later.");

  const link = await prisma.link.findUnique({ where: { id: linkId } });
  if (!link) throw new Error("Link not found");
  if (link.userId !== session.user.id) throw new Error("Unauthorized");

  return { session, userId, link };
}

const tagsSchema = z.array(z.string().trim().min(1).max(32)).max(24);

export async function setLinkTags(linkId: string, tags: string[]) {
  const { link } = await requireOwner(linkId);

  const normalized = tags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.toLowerCase());

  const unique = Array.from(new Set(normalized));
  const validated = tagsSchema.parse(unique);

  await prisma.link.update({
    where: { id: link.id },
    data: { tags: validated },
  });

  revalidatePath(`/links/${link.slug || link.id}`);
  revalidatePath("/admin");
  return { tags: validated };
}

const noteSchema = z.string().trim().min(1, "Note is empty").max(4000, "Note is too long");

export async function addLinkNote(linkId: string, body: string) {
  const { link } = await requireOwner(linkId);
  const noteBody = noteSchema.parse(body);

  const existing = asNotes(link.notes);
  const now = new Date().toISOString();
  const note: LinkNote = { id: crypto.randomUUID(), body: noteBody, createdAt: now, updatedAt: now };

  const next = [note, ...existing].slice(0, 100);

  await prisma.link.update({
    where: { id: link.id },
    data: { notes: next },
  });

  revalidatePath(`/links/${link.slug || link.id}`);
  return { note };
}

export async function updateLinkNote(linkId: string, noteId: string, body: string) {
  const { link } = await requireOwner(linkId);
  const noteBody = noteSchema.parse(body);

  const existing = asNotes(link.notes);
  const now = new Date().toISOString();
  const next = existing.map((n) => (n.id === noteId ? { ...n, body: noteBody, updatedAt: now } : n));

  await prisma.link.update({
    where: { id: link.id },
    data: { notes: next },
  });

  revalidatePath(`/links/${link.slug || link.id}`);
  return { ok: true };
}

export async function deleteLinkNote(linkId: string, noteId: string) {
  const { link } = await requireOwner(linkId);
  const existing = asNotes(link.notes);
  const next = existing.filter((n) => n.id !== noteId);

  await prisma.link.update({
    where: { id: link.id },
    data: { notes: next },
  });

  revalidatePath(`/links/${link.slug || link.id}`);
  return { ok: true };
}

const highlightSchema = z.object({
  quote: z.string().trim().min(1).max(2000),
  note: z.string().trim().max(2000).optional(),
});

export async function addLinkHighlight(linkId: string, input: { quote: string; note?: string }) {
  const { link } = await requireOwner(linkId);
  const data = highlightSchema.parse(input);

  const existing = asHighlights(link.highlights);
  const highlight: LinkHighlight = { id: crypto.randomUUID(), quote: data.quote, note: data.note, createdAt: new Date().toISOString() };
  const next = [highlight, ...existing].slice(0, 200);

  await prisma.link.update({
    where: { id: link.id },
    data: { highlights: next },
  });

  revalidatePath(`/links/${link.slug || link.id}`);
  return { highlight };
}

export async function deleteLinkHighlight(linkId: string, highlightId: string) {
  const { link } = await requireOwner(linkId);
  const existing = asHighlights(link.highlights);
  const next = existing.filter((h) => h.id !== highlightId);

  await prisma.link.update({
    where: { id: link.id },
    data: { highlights: next },
  });

  revalidatePath(`/links/${link.slug || link.id}`);
  return { ok: true };
}

export async function getRecentClicks(linkId: string, limit: number = 10) {
  const { userId, link } = await requireOwner(linkId);

  const rows = await prisma.click.findMany({
    where: { linkId: link.id },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(limit, 50)),
    select: {
      id: true,
      createdAt: true,
      referrer: true,
      country: true,
    },
  });

  return {
    userId,
    clicks: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      referrer: r.referrer,
      country: r.country,
    })),
  };
}

export async function getRelatedLinks(linkId: string, limit: number = 6) {
  const { link } = await requireOwner(linkId);

  let domain: string | null = link.domain || null;
  if (!domain) {
    try {
      domain = new URL(link.url).hostname.replace(/^www\./, "");
    } catch {
      domain = null;
    }
  }

  const rows = await prisma.link.findMany({
    where: {
      userId: link.userId,
      NOT: { id: link.id },
      OR: [
        ...(link.category ? [{ category: link.category }] : []),
        ...(domain ? [{ domain }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(limit, 12)),
    select: {
      id: true,
      slug: true,
      title: true,
      url: true,
      image: true,
      category: true,
      createdAt: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    url: r.url,
    image: r.image,
    category: r.category,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function generateInsights(linkId: string) {
  const { link } = await requireOwner(linkId);

  const result = await generateLinkInsights({
    url: link.url,
    title: link.title,
    description: link.description ?? null,
  });

  if (!result) {
    throw new Error("AI insights are not configured. Set AI_API_KEY (and optionally AI_MODEL) in Settings.");
  }

  const payload: LinkInsights = {
    summary: result.summary,
    keyTakeaways: result.keyTakeaways,
    topics: result.topics,
    entities: result.entities,
    suggestedTags: result.suggestedTags,
    updatedAt: new Date().toISOString(),
  };

  await prisma.link.update({
    where: { id: link.id },
    data: { insights: payload },
  });

  revalidatePath(`/links/${link.slug || link.id}`);
  return payload;
}

export async function requestArchive(linkId: string) {
  const { link } = await requireOwner(linkId);

  // Optimistically reflect pending state.
  await prisma.link.update({
    where: { id: link.id },
    data: {
      archive: {
        status: "pending",
        requestedAt: new Date().toISOString(),
      },
    },
  });

  try {
    await inngest.send({
      name: "link.archive.requested",
      data: { linkId: link.id, url: link.url },
    });
  } catch (e) {
    await prisma.link.update({
      where: { id: link.id },
      data: {
        archive: {
          status: "failed",
          requestedAt: new Date().toISOString(),
          error: "Archiving queue not configured. Set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY.",
        },
      },
    });
    throw e instanceof Error ? e : new Error("Failed to queue archive");
  }

  revalidatePath(`/links/${link.slug || link.id}`);
  return { ok: true };
}

export async function getDetailState(linkId: string) {
  const { link } = await requireOwner(linkId);

  return {
    tags: asStringArray(link.tags),
    notes: asNotes(link.notes),
    highlights: asHighlights(link.highlights),
    insights: asInsights(link.insights),
    archive: asArchive(link.archive),
    lastMetadataAt: link.lastMetadataAt?.toISOString() ?? null,
  };
}

export async function extractReader(linkId: string) {
  const { link } = await requireOwner(linkId);
  const extract = await fetchAndExtractReadableText(link.url);
  return {
    title: extract.title,
    excerpt: extract.excerpt,
    wordCount: extract.wordCount,
    text: extract.text,
  };
}
