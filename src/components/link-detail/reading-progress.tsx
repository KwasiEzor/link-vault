"use client";

import { useEffect, useState } from "react";

export function ReadingProgress({ offset = 0 }: { offset?: number }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, (scrollTop - offset) / maxScroll));
      setProgress(p);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);

  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-0.5 bg-transparent">
      <div
        className="h-full bg-primary/80"
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </div>
  );
}

