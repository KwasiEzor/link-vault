"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function JumpToTop({ className }: { className?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 right-6 z-40 h-11 w-11 rounded-2xl border border-white/10 bg-background/70 backdrop-blur-xl shadow-xl text-white/80 hover:text-white hover:bg-background/90 transition-colors",
        className
      )}
      aria-label="Jump to top"
      title="Jump to top"
    >
      <ArrowUp className="h-5 w-5 mx-auto" />
    </button>
  );
}

