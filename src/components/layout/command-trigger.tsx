"use client";

import { Search } from "lucide-react";

export function CommandTrigger() {
  const handleClick = () => {
    // Dispatch a ⌘K event to open the command palette
    const down = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(down);
  };

  return (
    <button 
      onClick={handleClick}
      className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest group cursor-pointer"
    >
      <Search className="h-3 w-3 group-hover:text-primary transition-colors" />
      <span>Search</span>
      <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 text-[9px] font-mono">⌘K</kbd>
    </button>
  );
}
