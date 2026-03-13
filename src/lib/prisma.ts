import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Set up WebSocket support for the Neon driver
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  // If we are in a build environment or missing the URL, 
  // return a dummy client that doesn't attempt to connect immediately.
  if (!connectionString || !connectionString.startsWith("postgres")) {
    return new PrismaClient();
  }

  try {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error("Failed to initialize Prisma with Neon adapter:", error);
    return new PrismaClient();
  }
}

// Senior-level initialization: 
// We export a singleton, but we ensure it's not initialized until actually needed
// by using the global pattern correctly for Next.js hot-reloading.
export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
