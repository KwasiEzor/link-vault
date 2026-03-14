import { lookup } from "node:dns/promises";
import net from "node:net";
import { LRUCache } from "lru-cache";

type HostSafety = { ok: true } | { ok: false; reason: string };

const hostSafetyCache = new LRUCache<string, HostSafety>({
  max: 2000,
  ttl: 5 * 60 * 1000, // 5 minutes
});

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;

  const [a, b] = parts;

  // 0.0.0.0/8, loopback, link-local
  if (a === 0) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;

  // RFC1918
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;

  // CGNAT 100.64.0.0/10
  if (a === 100 && b >= 64 && b <= 127) return true;

  // Multicast/reserved
  if (a >= 224) return true;

  return false;
}

function isPrivateIpv6(ip: string) {
  const normalized = ip.toLowerCase();

  // Loopback / unspecified
  if (normalized === "::1" || normalized === "::") return true;

  // Link-local fe80::/10
  if (normalized.startsWith("fe80:")) return true;

  // Unique local fc00::/7 (fc00..fdff)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // IPv4-mapped IPv6 addresses like ::ffff:127.0.0.1
  const v4Match = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Match?.[1]) return isPrivateIpv4(v4Match[1]);

  return false;
}

function isPrivateOrLocalIp(ip: string) {
  const ipVersion = net.isIP(ip);
  if (ipVersion === 4) return isPrivateIpv4(ip);
  if (ipVersion === 6) return isPrivateIpv6(ip);
  return true;
}

function isBlockedHostname(hostname: string) {
  const h = hostname.toLowerCase();
  if (!h) return true;

  if (h === "localhost") return true;
  if (h.endsWith(".localhost")) return true;
  if (h.endsWith(".local")) return true;
  if (h.endsWith(".internal")) return true;
  if (h.endsWith(".intranet")) return true;

  // Common local-ish sentinels
  if (h === "0.0.0.0") return true;
  if (h === "127.0.0.1") return true;
  if (h === "::1") return true;

  return false;
}

async function checkHostSafety(hostname: string): Promise<HostSafety> {
  const cached = hostSafetyCache.get(hostname);
  if (cached) return cached;

  if (isBlockedHostname(hostname)) {
    const unsafe: HostSafety = { ok: false, reason: "Hostname is blocked" };
    hostSafetyCache.set(hostname, unsafe);
    return unsafe;
  }

  // If it's an IP literal, block private/local ranges.
  if (net.isIP(hostname)) {
    const ok = !isPrivateOrLocalIp(hostname);
    const res: HostSafety = ok ? { ok: true } : { ok: false, reason: "IP is private or local" };
    hostSafetyCache.set(hostname, res);
    return res;
  }

  // Resolve DNS and ensure it doesn't point to private/local networks.
  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    for (const addr of addresses) {
      if (isPrivateOrLocalIp(addr.address)) {
        const unsafe: HostSafety = { ok: false, reason: "DNS resolves to private or local IP" };
        hostSafetyCache.set(hostname, unsafe);
        return unsafe;
      }
    }
  } catch {
    const unsafe: HostSafety = { ok: false, reason: "Hostname could not be resolved" };
    hostSafetyCache.set(hostname, unsafe);
    return unsafe;
  }

  const safe: HostSafety = { ok: true };
  hostSafetyCache.set(hostname, safe);
  return safe;
}

export async function assertSafeUrl(input: string) {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed");
  }

  // Prevent credentialed URLs, which are often used in SSRF/phishing patterns.
  if (parsed.username || parsed.password) {
    throw new Error("Credentialed URLs are not allowed");
  }

  const safety = await checkHostSafety(parsed.hostname);
  if (!safety.ok) {
    throw new Error(`URL is not allowed: ${safety.reason}`);
  }
}

export async function safeUrlOrNull(input: string | null | undefined) {
  if (!input) return null;
  try {
    await assertSafeUrl(input);
    return input;
  } catch {
    return null;
  }
}

