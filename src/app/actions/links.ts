"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { linkSchema, updateLinkSchema, type UpdateLinkInput } from "@/lib/schemas";
import { slugify } from "@/lib/utils";
import { actionRateLimiter } from "@/lib/rate-limit";

import { inngest } from "@/lib/inngest";

async function checkRateLimit() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const { isRateLimited } = actionRateLimiter.check(20, session.user.id);
  if (isRateLimited) {
    throw new Error("Action rate limit exceeded. Please try again later.");
  }
  return session;
}

export async function addLink(url: string, category: string = "general") {
  const validatedFields = linkSchema.safeParse({ url, category });

  if (!validatedFields.success) {
    const errorMsg = validatedFields.error.issues[0]?.message || "Validation failed";
    throw new Error(errorMsg);
  }

  const session = await checkRateLimit();
  const userId = session.user!.id!;

  // Initial placeholder title based on hostname
  let hostname = url;
  try {
    hostname = new URL(url).hostname;
  } catch (e) {
    // Fallback if URL is weird
  }

  const title = hostname;
  let slug = `${slugify(title)}-${Math.random().toString(36).substring(2, 7)}`;

  const link = await prisma.link.create({
    data: {
      url,
      title,
      slug,
      category: validatedFields.data.category,
      userId,
      enrichmentStatus: "pending",
    },
  });

  // Dispatch background metadata scraping
  await inngest.send({
    name: "link.created",
    data: {
      linkId: link.id,
      url: link.url,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return link;
}

export async function reEnrichLink(linkId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const link = await prisma.link.findUnique({
    where: { id: linkId },
  });

  if (!link || link.userId !== session.user.id) {
    throw new Error("Link not found or unauthorized");
  }

  // Manually dispatch the event to trigger Inngest workflow (Scrape + AI)
  await prisma.link.update({
    where: { id: link.id },
    data: { enrichmentStatus: "pending" }
  });

  await inngest.send({
    name: "link.created",
    data: {
      linkId: link.id,
      url: link.url,
    },
  });

  return { success: true };
}

export async function approveEnrichment(linkId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const link = await prisma.link.findUnique({
    where: { id: linkId },
  });

  if (!link || link.userId !== session.user.id) {
    throw new Error("Link not found or unauthorized");
  }

  if (!link.aiSummary && !link.aiCategory) {
    throw new Error("No AI suggestions to approve");
  }

  await prisma.link.update({
    where: { id: linkId },
    data: {
      description: link.aiSummary || link.description,
      category: link.aiCategory || link.category,
      enrichmentStatus: "idle", // Reset status after approval
      aiSummary: null, // Clear suggestions
      aiCategory: null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/curation");
  
  return { success: true };
}

export async function deleteLink(id: string) {
  const session = await checkRateLimit();
  const userId = session.user!.id!;

  await prisma.link.delete({
    where: {
      id,
      userId,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteLinks(ids: string[]) {
  const session = await checkRateLimit();
  const userId = session.user!.id!;

  await prisma.link.deleteMany({
    where: {
      id: { in: ids },
      userId,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateLink(id: string, data: UpdateLinkInput) {
  const validatedFields = updateLinkSchema.safeParse(data);

  if (!validatedFields.success) {
    const errorMsg = validatedFields.error.issues[0]?.message || "Validation failed";
    throw new Error(errorMsg);
  }

  const session = await checkRateLimit();
  const userId = session.user!.id!;

  const updateData = { ...validatedFields.data } as {
    title?: string;
    description?: string | null;
    category?: string | null;
    url?: string;
    image?: string | null;
    slug?: string;
  };
  
  if (updateData.title) {
    updateData.slug = slugify(updateData.title);
  }

  const link = await prisma.link.update({
    where: {
      id,
      userId,
    },
    data: updateData,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return link;
}

export async function getLinks(options?: { 
  cursor?: string; 
  limit?: number; 
  search?: string; 
  category?: string;
  userId?: string;
}) {
  const { cursor, limit = 9, search, category, userId } = options || {};

  // If userId is provided, ensure the caller is authorized to view those links
  if (userId) {
    const session = await auth();
    if (session?.user?.id !== userId) {
      throw new Error("Unauthorized");
    }
  }

  const where: {
    userId?: string;
    OR?: Array<{ title?: { contains: string }; description?: { contains: string }; url?: { contains: string } }>;
    category?: string;
  } = {};
  
  if (userId) {
    where.userId = userId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { url: { contains: search } },
    ];
  }

  if (category && category !== "all") {
    where.category = category;
  }

  const links = await prisma.link.findMany({
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          clicks: true,
        },
      },
    },
  });

  let nextCursor: string | undefined = undefined;
  let items = links;
  if (links.length > limit) {
    const nextItem = links.pop();
    nextCursor = nextItem!.id;
    items = links;
  }

  return {
    links: items.map(l => ({
      ...l,
      clicks: l._count.clicks,
    })),
    nextCursor,
  };

}

export async function getCategories(userId?: string) {
  const where = userId ? { userId } : {};
  const categories = await prisma.link.findMany({
    where,
    select: {
      category: true,
    },
    distinct: ["category"],
  });

  return Array.from(new Set(categories
    .map((c) => c.category)
    .filter((c): c is string => !!c)));
}

export async function getLinkBySlug(slug: string) {
  // Try finding by slug first, then fallback to ID
  let link = await prisma.link.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!link) {
    link = await prisma.link.findUnique({
      where: { id: slug }, // 'slug' might actually be an ID from an old URL
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });
  }

  return link;
}
