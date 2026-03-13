"use client";

import { useState, useTransition, useEffect } from "react";
import { LinkCard } from "@/components/link-card";
import { LinkCardSkeleton } from "@/components/link-card-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ChevronDown } from "lucide-react";
import { getLinks } from "@/app/actions/links";

type Link = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  category: string | null;
};
import { getLinks, getCategories } from "@/app/actions/links";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
...
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
...
  // Debounced search and category change
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await getLinks({ search, category });
        setLinks(result.links);
        setNextCursor(result.nextCursor);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [search, category]);

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const result = await getLinks({ cursor: nextCursor, search, category });
      setLinks(prev => [...prev, ...result.links]);
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
      <div className="relative pt-8">
        {isPending ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <LinkCardSkeleton key={i} />
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-32 glass rounded-[2.5rem] border-dashed border-white/10 shadow-inner">
            <p className="text-2xl font-bold text-muted-foreground italic">
              {search ? `No results found for "${search}"` : "Your vault is currently empty."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {links.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
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
