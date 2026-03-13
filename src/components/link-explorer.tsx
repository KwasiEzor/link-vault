"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { LinkCard } from "@/components/link-card";
import { LinkCardSkeleton } from "@/components/link-card-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ChevronDown } from "lucide-react";
import { getLinks } from "@/app/actions/links";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Link = {
  id: string;
  url: string;
  title: string;
  slug: string | null;
  description: string | null;
  image: string | null;
  category: string | null;
};

export function LinkExplorer({ 
  initialLinks, 
  initialNextCursor,
  initialCategories
}: { 
  initialLinks: Link[], 
  initialNextCursor?: string,
  initialCategories: string[]
}) {
  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isInitialMount = useRef(true);

  // Unified fetcher
  const fetchData = useCallback(async (s: string, c: string) => {
    startTransition(async () => {
      const result = await getLinks({ search: s, category: c });
      setLinks(result.links as Link[]);
      setNextCursor(result.nextCursor);
    });
  }, []);

  // Immediate effect for category changes
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }
    fetchData(search, category);
  }, [category, fetchData]); // Only depend on category

  // Debounced effect for search changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const timer = setTimeout(() => {
      fetchData(search, category);
    }, 500);

    return () => clearTimeout(timer);
  }, [search, fetchData]); // Only depend on search

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const result = await getLinks({ cursor: nextCursor, search, category });
      setLinks(prev => [...prev, ...result.links as Link[]]);
      setNextCursor(result.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-8">
        {/* Search Bar - More Focused */}
        <div className="max-w-2xl mx-auto w-full relative group">
          <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-300">
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            </div>
            <Input 
              placeholder="Search your knowledge vault..." 
              className="h-16 pl-14 pr-6 rounded-2xl bg-white/[0.03] border-white/10 focus:bg-white/[0.05] focus:ring-primary/20 transition-all text-lg font-medium placeholder:text-muted-foreground/30 shadow-2xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter - Modern Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 no-scrollbar">
          <button
            onClick={() => setCategory("all")}
            className={cn(
              "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 border whitespace-nowrap",
              category === "all" 
                ? "bg-primary border-primary text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]" 
                : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10"
            )}
          >
            All
          </button>
          {initialCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 border whitespace-nowrap",
                category === cat 
                  ? "bg-primary border-primary text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]" 
                  : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="relative pt-8 min-h-[400px]">
        {/* Loading Overlay for existing results */}
        {isPending && links.length > 0 && (
          <div className="absolute inset-0 z-20 flex items-start justify-center pt-20 bg-background/5 backdrop-blur-[2px] rounded-[2.5rem] transition-all duration-500">
            <div className="bg-background/80 p-4 rounded-2xl border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        )}

        {/* Results Grid */}
        <div className={`
          grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 transition-all duration-500
          ${isPending && links.length > 0 ? "opacity-30 blur-[2px] scale-[0.98] pointer-events-none" : "opacity-100 blur-0 scale-100"}
        `}>
          {links.map((link) => (
            <LinkCard key={link.id} link={link} />
          ))}
          
          {/* Skeleton placeholders when switching from empty state */}
          {isPending && links.length === 0 && (
            Array.from({ length: 6 }).map((_, i) => (
              <LinkCardSkeleton key={i} />
            ))
          )}
        </div>

        {/* Empty State */}
        {!isPending && links.length === 0 && (
          <div className="text-center py-32 glass rounded-[2.5rem] border-dashed border-white/10 shadow-inner animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-2xl font-bold text-muted-foreground italic">
              {search ? `No results found for "${search}"` : "Your vault is currently empty."}
            </p>
          </div>
        )}
      </div>

      {/* Load More */}
      {nextCursor && (
        <div className="flex justify-center pt-12">
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-xl border-white/10 hover:bg-white/5 px-8 font-bold"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Discover More
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
