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

  if (!connectionString) {
    console.error("DATABASE_URL is not set in environment variables.");
    return new PrismaClient();
  }

  // If it's a postgres URL, use the Neon adapter
  if (connectionString.startsWith("postgres")) {
    try {
      const pool = new Pool({ connectionString });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = new PrismaNeon(pool as any);
      return new PrismaClient({ adapter });
    } catch (error) {
      console.error("Neon adapter initialization failed, falling back to default Prisma client:", error);
    }
  }

  // Fallback: explicitly pass the URL to the constructor to ensure Prisma sees it
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
