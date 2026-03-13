import 'server-only';
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Singleton storage
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Creates a fresh Prisma instance with the Neon adapter.
 * This is called lazily to ensure environment variables are ready.
 */
function initPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error("❌ [Prisma] DATABASE_URL is missing.");
    // Return a default client that will throw a standard Prisma error on query
    return new PrismaClient();
  }

  // Neon-specific setup
  if (url.startsWith("postgres")) {
    try {
      // Required for Node.js environments (like Next.js server actions)
      neonConfig.webSocketConstructor = ws;

      const pool = new Pool({ connectionString: url });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = new PrismaNeon(pool as any);
      
      return new PrismaClient({ 
        adapter,
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
      });
    } catch (e) {
      console.error("❌ [Prisma] Neon adapter failed to initialize:", e);
    }
  }

  // Fallback for non-postgres or if adapter fails
  return new PrismaClient({
    datasources: { db: { url } }
  });
}

/**
 * Elite-tier Lazy Initialization Proxy
 * This object looks like PrismaClient but doesn't connect until you call a method.
 * This definitively fixes build-time/import-time environment issues.
 */
const prismaProxy = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    // 1. Check if we already have a singleton
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = initPrisma();
    }

    // 2. Access the property on the real instance
    const value = Reflect.get(globalForPrisma.prisma, prop, receiver);

    // 3. Bind methods so 'this' works correctly inside Prisma
    if (typeof value === "function") {
      return value.bind(globalForPrisma.prisma);
    }

    return value;
  }
});

export const prisma = prismaProxy;
