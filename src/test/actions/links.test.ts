import { describe, it, expect, vi, beforeEach } from "vitest";
import { addLink } from "@/app/actions/links";
import { auth } from "@/auth";

// Mocking dependencies
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/url-safety", () => ({
  assertSafeUrl: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    link: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/metadata", () => ({
  getMetadata: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("addLink Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw a validation error for invalid URL", async () => {
    await expect(addLink("not-a-url")).rejects.toThrow(/Invalid URL format/);
  });

  it("should throw Unauthorized if no session exists", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (auth as any).mockResolvedValue(null);

    await expect(addLink("https://google.com")).rejects.toThrow("Unauthorized");
  });

  it("should successfully add a link when input is valid", async () => {
    const mockUser = { id: "user-1" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (auth as any).mockResolvedValue({ user: mockUser });
    
    const mockMetadata = {
      title: "Test Title",
      description: "Test Desc",
      image: "test-img",
      url: "https://example.com"
    };
    const { getMetadata } = await import("@/lib/metadata");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getMetadata as any).mockResolvedValue(mockMetadata);

    const { prisma } = await import("@/lib/prisma");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.link.findUnique as any).mockResolvedValue(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.link.create as any).mockResolvedValue({ id: "link-1", slug: "test-title", ...mockMetadata });

    const result = await addLink("https://example.com", "tech");

    expect(result).toBeDefined();
    expect(prisma.link.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: "user-1",
        category: "tech",
        enrichmentStatus: "pending",
        url: "https://example.com"
      })
    }));
    
    // Check if slug starts with expected prefix (slugify('example.com'))
    const lastCall = vi.mocked(prisma.link.create).mock.calls[0][0];
    expect(lastCall.data.slug).toMatch(/^examplecom-/);
  });
});
