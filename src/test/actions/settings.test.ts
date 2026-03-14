import { describe, it, expect, vi, beforeEach } from "vitest";
import { testOpenAIConnection, testInngestConnection } from "@/app/actions/settings";
import { auth } from "@/auth";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("openai", () => {
  const MockOpenAI = vi.fn().mockImplementation(function() {
    return {
      models: {
        list: vi.fn(),
      },
    };
  });
  return { default: MockOpenAI };
});

vi.mock("inngest", () => {
  const MockInngest = vi.fn().mockImplementation(function() {
    return {
      send: vi.fn(),
    };
  });
  return { Inngest: MockInngest };
});

describe("Settings Actions - Connection Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("testOpenAIConnection", () => {
    it("should throw Unauthorized if no session exists", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue(null);
      await expect(testOpenAIConnection("key", "url")).rejects.toThrow("Unauthorized");
    });

    it("should return success when OpenAI call succeeds", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: "1" } });
      const OpenAI = (await import("openai")).default;
      const mockList = vi.fn().mockResolvedValue({ data: [] });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (OpenAI as any).mockImplementationOnce(function() {
        return {
          models: { list: mockList }
        };
      });

      const result = await testOpenAIConnection("valid-key", "https://api.openai.com/v1");
      expect(result).toEqual({ success: true, message: "Connection successful" });
      expect(mockList).toHaveBeenCalled();
    });

    it("should return failure when OpenAI call fails", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: "1" } });
      const OpenAI = (await import("openai")).default;
      const mockList = vi.fn().mockRejectedValue(new Error("Invalid API Key"));
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (OpenAI as any).mockImplementationOnce(function() {
        return {
          models: { list: mockList }
        };
      });

      const result = await testOpenAIConnection("invalid-key", "https://api.openai.com/v1");
      expect(result).toEqual({ success: false, message: "Invalid API Key" });
    });
  });

  describe("testInngestConnection", () => {
    it("should return success when Inngest send succeeds", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: "1" } });
      const { Inngest } = await import("inngest");
      const mockSend = vi.fn().mockResolvedValue({ ids: ["1"] });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Inngest as any).mockImplementationOnce(function() {
        return {
          send: mockSend
        };
      });

      const result = await testInngestConnection("valid-event-key", "valid-signing-key");
      expect(result).toEqual({ success: true, message: "Connection successful" });
      expect(mockSend).toHaveBeenCalledWith({ name: "link-vault/connection.test", data: {} });
    });

    it("should return failure when Inngest send fails", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (auth as any).mockResolvedValue({ user: { id: "1" } });
      const { Inngest } = await import("inngest");
      const mockSend = vi.fn().mockRejectedValue(new Error("Invalid Event Key"));
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Inngest as any).mockImplementationOnce(function() {
        return {
          send: mockSend
        };
      });

      const result = await testInngestConnection("invalid-key", "invalid-sign");
      expect(result).toEqual({ success: false, message: "Invalid Event Key" });
    });
  });
});
