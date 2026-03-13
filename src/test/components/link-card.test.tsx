import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LinkCard } from "@/components/link-card";
import { toast } from "sonner";

// Mocking icons and external components
vi.mock("lucide-react", () => ({
  ExternalLink: () => <div data-testid="external-link" />,
  Share2: () => <div data-testid="share-icon" />,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, @typescript-eslint/no-explicit-any
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

describe("LinkCard Component", () => {
  const mockLink = {
    id: "1",
    url: "https://nextjs.org",
    title: "Next.js Framework",
    description: "The React Framework for the Web.",
    image: "https://nextjs.org/og.png",
    category: "Development",
  };

  it("renders link title and description", () => {
    render(<LinkCard link={mockLink} />);
    expect(screen.getByText("Next.js Framework")).toBeInTheDocument();
    expect(screen.getByText("The React Framework for the Web.")).toBeInTheDocument();
  });

  it("renders the correct hostname", () => {
    render(<LinkCard link={mockLink} />);
    expect(screen.getByText("nextjs.org")).toBeInTheDocument();
  });

  it("copies link to clipboard when share icon clicked", async () => {
    // Mock clipboard
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    render(<LinkCard link={mockLink} />);
    const shareButton = screen.getByTitle("Copy link");
    fireEvent.click(shareButton);

    expect(writeText).toHaveBeenCalledWith(mockLink.url);
    expect(toast.success).toHaveBeenCalledWith("Link copied to clipboard!");
  });
});
