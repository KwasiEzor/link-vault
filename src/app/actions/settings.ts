"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { Inngest } from "inngest";

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

export async function testOpenAIConnection(apiKey: string, baseURL: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!apiKey) return { success: false, message: "API key is required" };

  try {
    const openai = new OpenAI({
      apiKey,
      baseURL: baseURL || "https://api.openai.com/v1",
      maxRetries: 0,
    });

    // Try to list models as a lightweight connection test
    await openai.models.list();
    
    return { success: true, message: "Connection successful" };
  } catch (error: unknown) {
    console.error("OpenAI connection test failed:", error);
    const message = error instanceof Error ? error.message : "Failed to connect to OpenAI";
    return { 
      success: false, 
      message
    };
  }
}

export async function testInngestConnection(eventKey: string, signingKey: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!eventKey) return { success: false, message: "Event key is required" };

  try {
    const inngest = new Inngest({ 
      id: "link-vault-test",
      eventKey,
      signingKey,
    });

    // Try to send a test event
    await inngest.send({
      name: "link-vault/connection.test",
      data: {},
    });

    return { success: true, message: "Connection successful" };
  } catch (error: unknown) {
    console.error("Inngest connection test failed:", error);
    const message = error instanceof Error ? error.message : "Failed to connect to Inngest";
    return { 
      success: false, 
      message
    };
  }
}
