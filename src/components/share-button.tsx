"use client";

import * as React from "react";
import { Share2, Copy, Twitter, Linkedin, Facebook } from "lucide-react";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn, getTwitterShareUrl, getLinkedInShareUrl, getFacebookShareUrl } from "@/lib/utils";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  variant?: "icon" | "full";
  className?: string;
}

export function ShareButton({ 
  url, 
  title, 
  description, 
  variant = "icon", 
  className 
}: ShareButtonProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || `Check out this link: ${title}`,
          url,
        });
        toast.success("Shared successfully!");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const shareOnSocial = (platform: "x" | "linkedin" | "facebook") => {
    let shareUrl = "";
    switch (platform) {
      case "x":
        shareUrl = getTwitterShareUrl(url, title);
        break;
      case "linkedin":
        shareUrl = getLinkedInShareUrl(url);
        break;
      case "facebook":
        shareUrl = getFacebookShareUrl(url);
        break;
    }
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const [canShareNative, setCanShareNative] = React.useState(false);

  React.useEffect(() => {
    if (typeof navigator !== "undefined" && !!navigator.share) {
      setCanShareNative(true);
    }
  }, []);

  if (variant === "icon") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button 
            className={cn(
              "text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5",
              className
            )}
            title="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass border-white/10 min-w-[180px]">
          {canShareNative && (
            <DropdownMenuItem onClick={handleShare} className="cursor-pointer gap-2">
              <Share2 className="h-4 w-4" />
              <span>Native Share</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer gap-2">
            <Copy className="h-4 w-4" />
            <span>Copy Link</span>
          </DropdownMenuItem>
          <div className="h-px bg-white/10 my-1" />
          <DropdownMenuItem onClick={() => shareOnSocial("x")} className="cursor-pointer gap-2">
            <Twitter className="h-4 w-4" />
            <span>Share on X</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => shareOnSocial("linkedin")} className="cursor-pointer gap-2">
            <Linkedin className="h-4 w-4" />
            <span>Share on LinkedIn</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => shareOnSocial("facebook")} className="cursor-pointer gap-2">
            <Facebook className="h-4 w-4" />
            <span>Share on Facebook</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button 
          variant="outline" 
          className={cn(
            "h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold group",
            className
          )}
        >
          <Share2 className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-white/10 min-w-[200px] p-2">
        {canShareNative && (
          <DropdownMenuItem onClick={handleShare} className="cursor-pointer gap-2 py-2.5 rounded-lg">
            <Share2 className="h-4 w-4 text-primary" />
            <span className="font-semibold">Native Share</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer gap-2 py-2.5 rounded-lg">
          <Copy className="h-4 w-4 text-primary" />
          <span className="font-semibold">Copy Link</span>
        </DropdownMenuItem>
        <div className="h-px bg-white/10 my-2" />
        <DropdownMenuItem onClick={() => shareOnSocial("x")} className="cursor-pointer gap-2 py-2.5 rounded-lg">
          <Twitter className="h-4 w-4 text-sky-400" />
          <span className="font-semibold">Share on X</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareOnSocial("linkedin")} className="cursor-pointer gap-2 py-2.5 rounded-lg">
          <Linkedin className="h-4 w-4 text-blue-600" />
          <span className="font-semibold">Share on LinkedIn</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareOnSocial("facebook")} className="cursor-pointer gap-2 py-2.5 rounded-lg">
          <Facebook className="h-4 w-4 text-blue-500" />
          <span className="font-semibold">Share on Facebook</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
