"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { LinkCard } from "@/components/link-card";
import { LinkCardSkeleton } from "@/components/link-card-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ChevronDown } from "lucide-react";
import { getLinks } from "@/app/actions/links";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        {/* Search Bar */}
        <div className="w-full max-w-xl relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </div>
          <Input 
            placeholder="Search your vault..." 
            className="h-14 pl-12 pr-6 rounded-2xl bg-white/5 border-white/10 focus:bg-white/10 focus:ring-primary/20 transition-all text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <Tabs value={category} onValueChange={setCategory} className="w-auto">
          <TabsList className="bg-white/5 border border-white/10 h-14 p-1 rounded-2xl">
            <TabsTrigger value="all" className="rounded-xl px-6 h-12 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold uppercase tracking-widest text-[10px]">All Assets</TabsTrigger>
            {initialCategories.slice(0, 4).map(cat => (
              <TabsTrigger key={cat} value={cat} className="rounded-xl px-6 h-12 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold uppercase tracking-widest text-[10px]">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
