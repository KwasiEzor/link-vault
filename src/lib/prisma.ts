import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  // Extremely defensive: if no URL, return a basic client that will throw 
  // a readable error ONLY when a query is actually made, instead of crashing on import
  if (!connectionString || connectionString.includes("localhost") || !connectionString.startsWith("postgres")) {
    return new PrismaClient();
  }

  // Set up WebSocket support for the Neon driver only when we have a valid URL
  if (typeof window === "undefined") {
    neonConfig.webSocketConstructor = ws;
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
