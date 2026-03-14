"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";
import { Inngest } from "inngest";
import { getSetting } from "@/lib/settings";

export async function getSettings() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const settings = await prisma.systemSetting.findMany();
  const dbMap = new Map(settings.map((s) => [s.key, s.value]));

  const secretKeys = ["AI_API_KEY", "INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY"] as const;
  const booleanKeys = ["AI_ENABLED", "HEALTH_CHECK_ENABLED", "METADATA_SCRAPING_ENABLED"] as const;

  const result: Record<string, string | boolean> = {};

  for (const key of booleanKeys) {
    const dbValue = dbMap.get(key);
    const envValue = process.env[key];
    const effective = dbValue ?? envValue;
    result[key] = effective === undefined ? true : effective === "true";
  }

  // Non-secret string settings with env fallback.
  result.AI_BASE_URL = (dbMap.get("AI_BASE_URL") ?? process.env.AI_BASE_URL ?? "https://api.openai.com/v1") as string;
  result.AI_MODEL = (dbMap.get("AI_MODEL") ?? process.env.AI_MODEL ?? "gpt-3.5-turbo") as string;

  // Secrets: never send the actual value to the client, only presence + source.
  for (const key of secretKeys) {
    const dbValue = dbMap.get(key);
    const dbPresent = !!dbValue && dbValue.trim().length > 0;
    const envPresent = !!process.env[key] && process.env[key]!.trim().length > 0;
    const present = dbPresent || envPresent;
    const source = dbPresent ? "db" : envPresent ? "env" : "none";

    result[key] = ""; // intentionally blank
    result[`${key}_PRESENT`] = present;
    result[`${key}_SOURCE`] = source;
  }

  return result;
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

  const secretKeys = new Set(["AI_API_KEY", "INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY"]);
  const CLEAR_SENTINEL = "__CLEAR__";

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    
    const stringValue = String(value);

    // Prevent accidental wiping of secrets when the UI keeps secret inputs blank.
    if (secretKeys.has(key) && stringValue.trim() === "") {
      continue;
    }

    const finalValue = secretKeys.has(key) && stringValue === CLEAR_SENTINEL ? "" : stringValue;
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: finalValue },
      create: { key, value: finalValue },
    });
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function testOpenAIConnection(apiKey: string, baseURL: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const effectiveApiKey = apiKey || (await getSetting<string | undefined>("AI_API_KEY", undefined));
  const effectiveBaseUrl =
    baseURL || (await getSetting<string>("AI_BASE_URL", "https://api.openai.com/v1"));

  if (!effectiveApiKey) return { success: false, message: "API key is required" };

  try {
    const openai = new OpenAI({
      apiKey: effectiveApiKey,
      baseURL: effectiveBaseUrl,
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

  const effectiveEventKey = eventKey || (await getSetting<string | undefined>("INNGEST_EVENT_KEY", undefined));
  const effectiveSigningKey = signingKey || (await getSetting<string | undefined>("INNGEST_SIGNING_KEY", undefined)) || "";

  if (!effectiveEventKey) return { success: false, message: "Event key is required" };

  try {
    const inngest = new Inngest({ 
      id: "link-vault-test",
      eventKey: effectiveEventKey,
      signingKey: effectiveSigningKey,
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
