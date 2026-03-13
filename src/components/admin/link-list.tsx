"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Trash2, ExternalLink, MoreVertical, Calendar, Tag, Pencil, CheckSquare, Square, Copy, Loader2, ChevronDown, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import { deleteLink, getLinks, reEnrichLink } from "@/app/actions/links";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EditLinkDialog } from "./edit-link-dialog";
import { BulkActions } from "./bulk-actions";
import { SearchAndFilter } from "./search-and-filter";

type Link = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  category: string | null;
  status: string | null;
  createdAt: Date;
  clicks: number;
};

interface LinkListProps {
  userId: string;
  initialLinks: Link[];
  initialNextCursor?: string;
  categories: string[];
}

function FormattedDate({ date }: { date: Date | string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dateObj = new Date(date);
  
  // Static placeholder that is valid on both server and client
  if (!mounted) {
    return (
      <span className="inline-block min-w-[80px] h-4 bg-white/5 animate-pulse rounded" />
    );
  }

  return (
    <>{dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</>
  );
}

export function LinkList({ userId, initialLinks, initialNextCursor, categories }: LinkListProps) {
  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const isInitialMount = useRef(true);

  // Fetcher for Search & Filter
  const fetchData = useCallback(async (s: string, c: string) => {
    startTransition(async () => {
      const result = await getLinks({ userId, search: s, category: c, limit: 15 });
      setLinks(result.links as Link[]);
      setNextCursor(result.nextCursor);
    });
  }, [userId]);

  // Effects for Search & Filter
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => fetchData(search, categoryFilter), 500);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, fetchData]);

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const result = await getLinks({ userId, cursor: nextCursor, search, category: categoryFilter, limit: 15 });
      setLinks(prev => [...prev, ...result.links as Link[]]);
      setNextCursor(result.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === links.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(links.map(l => l.id));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    
    setIsDeleting(id);
    try {
      await deleteLink(id);
      setLinks(prev => prev.filter(l => l.id !== id));
      toast.success("Link deleted successfully");
    } catch {
      toast.error("Failed to delete link");
    } finally {
      setIsDeleting(null);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  const handleReEnrich = async (id: string) => {
    toast.promise(reEnrichLink(id), {
      loading: "AI is re-analyzing this asset...",
      success: "Re-enrichment triggered! Metadata will update in a few seconds.",
      error: "Failed to trigger re-enrichment.",
    });
  };

  return (
    <div className="space-y-4">
      <SearchAndFilter 
        search={search}
        onSearchChange={setSearch}
        category={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
      />

      <div className="glass rounded-[2rem] border-white/5 shadow-2xl overflow-hidden relative">
        {isPending && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/5 backdrop-blur-[1px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/5 border-white/5 hover:bg-white/5">
                <TableHead className="w-[50px] px-6 py-4">
                  <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-primary transition-colors">
                    {selectedIds.length === links.length && links.length > 0 ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Asset</TableHead>
                <TableHead className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Category</TableHead>
                <TableHead className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground text-center">Visits</TableHead>
                <TableHead className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Curated</TableHead>
                <TableHead className="px-6 py-4 text-right font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id} className={cn(
                  "border-white/5 hover:bg-white/[0.02] group transition-all duration-300",
                  selectedIds.includes(link.id) ? "bg-primary/5" : ""
                )}>
                  <TableCell className="px-6 py-5">
                    <button 
                      onClick={() => toggleSelect(link.id)} 
                      className={cn(
                        "transition-colors",
                        selectedIds.includes(link.id) ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"
                      )}
                    >
                      {selectedIds.includes(link.id) ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex flex-col gap-0.5 max-w-[400px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                          {link.title}
                        </span>
                        {!link.description && !link.image && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/5 border border-primary/10 animate-pulse">
                            <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />
                            <span className="text-[8px] font-bold uppercase tracking-tighter text-primary">Scraping</span>
                          </div>
                        )}
                        {link.status === "broken" && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
                            <AlertTriangle className="h-2.5 w-2.5 text-red-500" />
                            <span className="text-[8px] font-bold uppercase tracking-tighter text-red-500">Broken</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono truncate opacity-60">
                        {link.url}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3 w-3 text-primary opacity-50" />
                      <Badge variant="secondary" className="bg-primary/10 hover:bg-primary/20 text-primary border-none text-[10px] font-bold uppercase tracking-tighter">
                        {link.category || "general"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      <span className="text-xs font-black text-white">{link.clicks || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-muted-foreground text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 opacity-40" />
                      <FormattedDate date={link.createdAt} />
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => copyUrl(link.url)}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10")}
                        title="Copy URL"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10")}
                        title="Visit Site"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-white/5">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-white/10 min-w-[180px] p-2">
                          <DropdownMenuItem 
                            className="font-medium rounded-lg cursor-pointer"
                            onClick={() => setEditingLink(link)}
                          >
                            <Pencil className="mr-2 h-4 w-4 text-primary" />
                            Edit Asset
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="font-bold text-indigo-400 focus:bg-indigo-400/10 focus:text-indigo-400 rounded-lg cursor-pointer"
                            onClick={() => handleReEnrich(link.id)}
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            AI Re-Enrich
                          </DropdownMenuItem>
                          <div className="h-px bg-white/5 my-1" />
                          <DropdownMenuItem 
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive font-bold rounded-lg cursor-pointer"
                            onClick={() => handleDelete(link.id)}
                            disabled={isDeleting === link.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting === link.id ? "Removing..." : "Remove Asset"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {!isPending && links.length === 0 && (
          <div className="text-center py-20 bg-white/[0.01]">
            <p className="text-muted-foreground font-medium italic">
              {search || categoryFilter !== "all" ? "No assets match your search." : "Your vault is currently empty."}
            </p>
          </div>
        )}
      </div>

      {nextCursor && (
        <div className="flex justify-center pt-8">
          <Button 
            variant="outline" 
            className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold px-8 h-12 transition-all active:scale-95 shadow-xl"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Curating more...
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Load More Assets
              </>
            )}
          </Button>
        </div>
      )}

      <BulkActions 
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        onComplete={() => {
          setSelectedIds([]);
          // Refresh data if needed, or rely on local state if we want to be faster
          // For now, deleteLinks is a server action that revalidates, so we might need to refresh
          fetchData(search, categoryFilter);
        }}
      />

      {editingLink && (
        <EditLinkDialog
          link={editingLink}
          open={!!editingLink}
          onOpenChange={(open) => !open && setEditingLink(null)}
        />
      )}
    </div>
  );
}
