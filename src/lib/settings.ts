import { prisma } from "./prisma";

export async function getSetting<T = string>(key: string, defaultValue?: T): Promise<T> {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  
  if (!setting) {
    const envValue = process.env[key];
    if (envValue !== undefined) {
      if (typeof defaultValue === "boolean") {
        return (envValue === "true") as T;
      }
      return envValue as T;
    }
    return defaultValue as T;
  }

  if (typeof defaultValue === "boolean") {
    return (setting.value === "true") as T;
  }

  return setting.value as T;
}

export async function getAllSettings() {
  const settings = await prisma.systemSetting.findMany();
  return settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);
}
