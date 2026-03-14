"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getSettings() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const settings = await prisma.systemSetting.findMany();
  const booleanKeys = ["AI_ENABLED", "HEALTH_CHECK_ENABLED", "METADATA_SCRAPING_ENABLED"];
  
  return settings.reduce((acc, s) => {
    acc[s.key] = booleanKeys.includes(s.key) ? s.value === "true" : s.value;
    return acc;
  }, {} as Record<string, string | boolean>);
}

export async function updateSetting(key: string, value: string | boolean) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const stringValue = String(value);

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: stringValue },
    create: { key, value: stringValue },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateSettings(data: Record<string, string | boolean>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    
    const stringValue = String(value);
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: stringValue },
      create: { key, value: stringValue },
    });
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
