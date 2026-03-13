"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function recordVisit(linkId: string, metadata: { userAgent?: string, referrer?: string, ip?: string } = {}) {
  try {
    await prisma.click.create({
      data: {
        linkId,
        userAgent: metadata.userAgent,
        referrer: metadata.referrer,
        ip: metadata.ip,
      },
    });
    // Optional: revalidate path if we show click count on the public page
    // revalidatePath(`/links/${linkId}`);
  } catch (error) {
    console.error("Failed to record visit:", error);
  }
}

export async function getAnalyticsData(userId: string, days: number = 7) {
  const session = await auth();
  if (session?.user?.id !== userId) {
    throw new Error("Unauthorized");
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const clicks = await prisma.click.findMany({
    where: {
      link: {
        userId: userId,
      },
      createdAt: {
        gte: startDate,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      createdAt: true,
    },
  });

  // Group by day
  const dataMap = new Map<string, number>();
  
  // Initialize with 0 for all days in range
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dataMap.set(dateString, 0);
  }

  clicks.forEach(click => {
    const dateString = click.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dataMap.has(dateString)) {
      dataMap.set(dateString, dataMap.get(dateString)! + 1);
    }
  });

  return Array.from(dataMap.entries())
    .map(([date, clicks]) => ({ date, clicks }))
    .reverse(); // Chronological order
}

export async function getTotalClicks(userId: string) {
  const session = await auth();
  if (session?.user?.id !== userId) {
    throw new Error("Unauthorized");
  }

  return await prisma.click.count({
    where: {
      link: {
        userId,
      },
    },
  });
}
