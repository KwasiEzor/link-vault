"use client";

import { useState, useTransition, useEffect } from "react";
import { LinkCard } from "@/components/link-card";
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

export function LinkExplorer({ 
  initialLinks, 
  initialNextCursor 
}: { 
  initialLinks: Link[], 
  initialNextCursor?: string 
}) {
  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await getLinks({ search });
        setLinks(result.links);
        setNextCursor(result.nextCursor);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const result = await getLinks({ cursor: nextCursor, search });
      setLinks(prev => [...prev, ...result.links]);
      setNextCursor(result.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Search Bar */}
      <div className="max-w-xl mx-auto relative group">
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

      {/* Grid */}
      <div className="relative pt-8">
        {links.length === 0 ? (
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
