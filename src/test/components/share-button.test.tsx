import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShareButton } from "@/components/share-button";
import { toast } from "sonner";

// Mocking icons and external components
vi.mock("lucide-react", () => ({
  Share2: () => <div data-testid="share-icon" />,
  Copy: () => <div data-testid="copy-icon" />,
  Twitter: () => <div data-testid="twitter-icon" />,
  Linkedin: () => <div data-testid="linkedin-icon" />,
  Facebook: () => <div data-testid="facebook-icon" />,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ShareButton Component", () => {
  const mockProps = {
    url: "https://example.com",
    title: "Example Title",
    description: "Example Description",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator mocks
    Object.defineProperty(window, 'navigator', {
      value: {
        share: undefined,
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      },
      writable: true,
    });
    // Mock window.open
    vi.stubGlobal('open', vi.fn());
  });

  it("renders correctly in icon variant", () => {
    render(<ShareButton {...mockProps} variant="icon" />);
    expect(screen.getByTitle("Share")).toBeInTheDocument();
  });

  it("renders correctly in full variant", () => {
    render(<ShareButton {...mockProps} variant="full" />);
    expect(screen.getByText("Share")).toBeInTheDocument();
  });

  it("copies to clipboard when Copy Link is clicked", async () => {
    render(<ShareButton {...mockProps} variant="icon" />);
    
    // Open dropdown
    fireEvent.click(screen.getByTitle("Share"));
    
    // Click copy
    const copyOption = screen.getByText("Copy Link");
    fireEvent.click(copyOption);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockProps.url);
    expect(toast.success).toHaveBeenCalledWith("Link copied to clipboard!");
  });

  it("calls navigator.share when Native Share is clicked and supported", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'share', {
      value: mockShare,
      configurable: true
    });

    render(<ShareButton {...mockProps} variant="icon" />);
    
    // Open dropdown
    fireEvent.click(screen.getByTitle("Share"));
    
    // Click Native Share
    const nativeShareOption = screen.getByText("Native Share");
    fireEvent.click(nativeShareOption);
    
    expect(mockShare).toHaveBeenCalledWith({
      title: mockProps.title,
      text: mockProps.description,
      url: mockProps.url,
    });
  });

  it("opens Twitter share URL when Share on X is clicked", () => {
    render(<ShareButton {...mockProps} variant="icon" />);
    
    fireEvent.click(screen.getByTitle("Share"));
    fireEvent.click(screen.getByText("Share on X"));
    
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("twitter.com/intent/tweet"),
      "_blank",
      "noopener,noreferrer"
    );
  });
});
