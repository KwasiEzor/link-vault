"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMetadata } from "@/lib/metadata";
import { revalidatePath } from "next/cache";
import { linkSchema, updateLinkSchema, type UpdateLinkInput } from "@/lib/schemas";

export async function addLink(url: string, category: string = "general") {
  const validatedFields = linkSchema.safeParse({ url, category });

  if (!validatedFields.success) {
    const errorMsg = validatedFields.error.issues[0]?.message || "Validation failed";
    throw new Error(errorMsg);
  }

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const metadata = await getMetadata(url);

  if (!metadata) {
    throw new Error("Could not fetch metadata for URL");
  }

  const link = await prisma.link.create({
    data: {
      url: metadata.url || url,
      title: metadata.title,
      description: metadata.description,
      image: metadata.image,
      category: validatedFields.data.category,
      userId: session.user.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return link;
}

export async function deleteLink(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.link.delete({
    where: {
      id,
      userId: session.user.id,
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

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const link = await prisma.link.update({
    where: {
      id,
      userId: session.user.id,
    },
    data: validatedFields.data,
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
}) {
  const { cursor, limit = 9, search, category } = options || {};

  const where: {
    OR?: Array<{ title?: { contains: string }; description?: { contains: string }; url?: { contains: string } }>;
    category?: string;
  } = {};
  
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
    take: limit + 1, // Fetch one extra to determine if there is a next page
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  let nextCursor: string | undefined = undefined;
  if (links.length > limit) {
    const nextItem = links.pop();
    nextCursor = nextItem?.id;
  }

  return {
    links,
    nextCursor,
  };
}

export async function getCategories() {
  const categories = await prisma.link.findMany({
    select: {
      category: true,
    },
    distinct: ["category"],
  });

  return Array.from(new Set(categories
    .map((c) => c.category)
    .filter((c): c is string => !!c)));
}
