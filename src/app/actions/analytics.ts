"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function recordVisit(linkId: string, metadata: { userAgent?: string, referrer?: string, ip?: string, country?: string } = {}) {
  try {
    await prisma.click.create({
      data: {
        linkId,
        userAgent: metadata.userAgent,
        referrer: metadata.referrer,
        ip: metadata.ip,
        country: metadata.country,
      },
    });
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

export async function getBreakdownData(userId: string) {
  const session = await auth();
  if (session?.user?.id !== userId) {
    throw new Error("Unauthorized");
  }

  const clicks = await prisma.click.findMany({
    where: {
      link: {
        userId,
      },
    },
    select: {
      userAgent: true,
      referrer: true,
      ip: true,
      country: true,
    },
  });

  const devices: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0, Other: 0 };
  const referrers: Record<string, number> = {};
  const countries: Record<string, number> = {};

  clicks.forEach((click) => {
    // Basic Device Detection
    const ua = click.userAgent?.toLowerCase() || "";
    if (ua.includes("mobi")) devices.Mobile++;
    else if (ua.includes("tablet") || ua.includes("ipad")) devices.Tablet++;
    else if (ua.length > 10) devices.Desktop++;
    else devices.Other++;

    // Country Tracking
    if (click.country) {
      countries[click.country] = (countries[click.country] || 0) + 1;
    }

    // Referrer Cleaning
    if (click.referrer) {
      try {
        const domain = new URL(click.referrer).hostname.replace("www.", "");
        referrers[domain] = (referrers[domain] || 0) + 1;
      } catch {
        referrers["Direct/Unknown"] = (referrers["Direct/Unknown"] || 0) + 1;
      }
    } else {
      referrers["Direct/Unknown"] = (referrers["Direct/Unknown"] || 0) + 1;
    }
  });

  return {
    devices: Object.entries(devices)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value })),
    referrers: Object.entries(referrers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value })),
    countries: Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value })),
  };
}
