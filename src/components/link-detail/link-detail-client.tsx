"use client";

import * as React from "react";
import Image from "next/image";
import NextLink from "next/link";
import { toast } from "sonner";
import {
  Calendar,
  ExternalLink,
  Globe,
  RefreshCw,
  Archive,
  Pencil,
  Copy,
  Sparkles,
  StickyNote,
  Highlighter,
  History,
  Network,
  Tags,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShareButton } from "@/components/share-button";
import { EditLinkDialog } from "@/components/admin/edit-link-dialog";
import { reEnrichLink } from "@/app/actions/links";
import {
  addLinkHighlight,
  addLinkNote,
  deleteLinkHighlight,
  deleteLinkNote,
  extractReader,
  generateInsights,
  getDetailState,
  getRecentClicks,
  getRelatedLinks,
  requestArchive,
  setLinkTags,
  updateLinkNote,
} from "@/app/actions/link-detail";
import type { LinkArchive, LinkHighlight, LinkInsights, LinkNote } from "@/app/actions/link-detail";

type LinkUser = {
  name: string | null;
  image: string | null;
};

export type LinkDetailClientLink = {
  id: string;
  userId: string;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  category: string | null;
  status: string | null;
  enrichmentStatus: string | null;
  createdAt: string;
  updatedAt: string;
  slug: string | null;
  user: LinkUser;
  tags?: string[];
  insights?: unknown;
  notes?: unknown;
  highlights?: unknown;
  archive?: unknown;
};

export function LinkDetailClient({
  link,
  hostname,
  isOwner,
}: {
  link: LinkDetailClientLink;
  hostname: string;
  isOwner: boolean;
}) {
  const [activeView, setActiveView] = React.useState<"preview" | "reader">("preview");
  const [editOpen, setEditOpen] = React.useState(false);
  const [refreshing, startRefresh] = React.useTransition();
  const [tagsSaving, startTagsTransition] = React.useTransition();
  const [activeTab, setActiveTab] = React.useState("details");
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [tags, setTagsState] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState<LinkNote[]>([]);
  const [highlights, setHighlights] = React.useState<LinkHighlight[]>([]);
  const [insights, setInsights] = React.useState<LinkInsights | null>(null);
  const [archive, setArchive] = React.useState<LinkArchive | null>(null);
  const [lastMetadataAt, setLastMetadataAt] = React.useState<string | null>(null);

  const [reader, setReader] = React.useState<{ title: string | null; wordCount: number; excerpt: string | null; text: string } | null>(null);
  const [readerLoading, setReaderLoading] = React.useState(false);
  const [readerError, setReaderError] = React.useState<string | null>(null);

  const [clicks, setClicks] = React.useState<Array<{ id: string; createdAt: string; referrer: string | null; country: string | null }> | null>(null);
  const [related, setRelated] = React.useState<Array<{ id: string; slug: string | null; title: string; url: string; image: string | null; category: string | null; createdAt: string }> | null>(null);

  const createdLabel = React.useMemo(() => {
    try {
      return new Date(link.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return "";
    }
  }, [link.createdAt]);

  React.useEffect(() => {
    if (!isOwner) return;
    let mounted = true;
    setDetailsLoading(true);
    getDetailState(link.id)
      .then((state) => {
        if (!mounted) return;
        setTagsState(state.tags);
        setNotes(state.notes);
        setHighlights(state.highlights);
        setInsights(state.insights);
        setArchive(state.archive);
        setLastMetadataAt(state.lastMetadataAt);
      })
      .catch((e) => {
        console.error("Failed to load link detail state:", e);
      })
      .finally(() => {
        if (mounted) setDetailsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isOwner, link.id]);

  React.useEffect(() => {
    if (!isOwner) return;
    if (!archive || archive.status !== "pending") return;

    let cancelled = false;
    const interval = setInterval(() => {
      getDetailState(link.id)
        .then((state) => {
          if (cancelled) return;
          setArchive(state.archive);
        })
        .catch(() => {
          // ignore polling errors
        });
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [archive, isOwner, link.id]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const onRefreshMetadata = () => {
    startRefresh(async () => {
      try {
        await reEnrichLink(link.id);
        toast.success("Metadata refresh queued.");
        setLastMetadataAt(new Date().toISOString());
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to refresh metadata");
      }
    });
  };

  const saveTags = (next: string[]) => {
    startTagsTransition(async () => {
      try {
        const res = await setLinkTags(link.id, next);
        setTagsState(res.tags);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update tags");
      }
    });
  };

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (!t) return;
    if (tags.includes(t)) return;
    saveTags([t, ...tags]);
  };

  const removeTag = (t: string) => {
    saveTags(tags.filter((x) => x !== t));
  };

  const onRequestArchive = () => {
    startRefresh(async () => {
      try {
        await requestArchive(link.id);
        toast.success("Archive queued.");
        setArchive({ status: "pending", requestedAt: new Date().toISOString() });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to request archive");
      }
    });
  };

  const createHighlightFromSelection = async () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() || "";
    if (!text) {
      toast.error("Select some text first.");
      return;
    }
    if (text.length > 2000) {
      toast.error("Selection too long. Try a shorter highlight.");
      return;
    }
    try {
      const res = await addLinkHighlight(link.id, { quote: text });
      setHighlights((prev) => [res.highlight, ...prev]);
      toast.success("Highlight saved.");
      sel?.removeAllRanges();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save highlight");
    }
  };

  React.useEffect(() => {
    if (!isOwner) return;
    if (activeView !== "reader") return;
    if (reader || readerLoading) return;

    if (archive?.status === "completed" && typeof archive?.text === "string" && archive.text.trim()) {
      setReader({
        title: typeof archive?.title === "string" ? archive.title : null,
        excerpt: typeof archive?.excerpt === "string" ? archive.excerpt : null,
        wordCount: typeof archive?.wordCount === "number" ? archive.wordCount : archive.text.split(" ").filter(Boolean).length,
        text: archive.text,
      });
      return;
    }
    setReaderLoading(true);
    setReaderError(null);
    extractReader(link.id)
      .then((res) => setReader(res))
      .catch((e) => setReaderError(e instanceof Error ? e.message : "Reader extraction failed"))
      .finally(() => setReaderLoading(false));
  }, [activeView, archive, isOwner, link.id, reader, readerLoading]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          {/* Hero Section */}
          <div className="relative aspect-video w-full rounded-[40px] overflow-hidden border border-white/10 shadow-2xl group bg-slate-950">
            {link.image ? (
              <Image
                src={link.image}
                alt={link.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 italic font-medium">No preview available</div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-80" />

            {/* View Toggle - Top Right */}
            <div className="absolute top-6 right-6">
              <div className="inline-flex rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 p-1.5 shadow-2xl">
                <button
                  type="button"
                  className={cn(
                    "h-9 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    activeView === "preview" 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  onClick={() => setActiveView("preview")}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className={cn(
                    "h-9 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    activeView === "reader" 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  onClick={() => setActiveView("reader")}
                >
                  Reader
                </button>
              </div>
            </div>

            {/* Reader Controls Overlay */}
            {activeView === "reader" && (
              <div className="absolute bottom-6 left-6 right-6">
                <div className="rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl p-4 shadow-2xl flex items-center justify-between gap-4">
                  {!isOwner ? (
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest">
                      Curator-only mode
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        {readerLoading ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Analyzing…</span>
                          </div>
                        ) : reader ? (
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                            {reader.wordCount.toLocaleString()} Words extracted
                          </span>
                        ) : null}
                      </div>
                      {reader && (
                        <button
                          type="button"
                          onClick={createHighlightFromSelection}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-9 rounded-xl border-white/10 bg-white/10 hover:bg-white/20 font-black text-[10px] uppercase tracking-widest transition-all"
                          )}
                        >
                          <Highlighter className="mr-2 h-3.5 w-3.5" />
                          Highlight Selection
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.15em]">
                    <Tags className="h-3 w-3" />
                    {link.category || "General"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-[0.15em]">
                    <Calendar className="h-3 w-3" />
                    {createdLabel}
                  </span>
                  {typeof link.enrichmentStatus === "string" && (
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.15em]",
                      link.enrichmentStatus === "completed" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      link.enrichmentStatus === "failed" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                      "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    )}>
                      <Network className="h-3 w-3" />
                      {link.enrichmentStatus}
                    </span>
                  )}
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white">
                  {link.title}
                </h1>
              </div>

              {/* Sticky Action Bar */}
              <div className="sticky top-20 z-30">
                <div className="rounded-[24px] bg-background/40 border border-white/10 backdrop-blur-2xl shadow-2xl p-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 transition-all active:scale-95 flex-1 sm:flex-none justify-center"
                      )}
                    >
                      Open Link
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>

                    <button
                      type="button"
                      onClick={copyUrl}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "h-12 px-6 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase tracking-widest text-[11px] flex-1 sm:flex-none transition-all"
                      )}
                    >
                      <Copy className="mr-2.5 h-4 w-4" />
                      Copy
                    </button>

                    <div className="h-12 flex items-center px-1 rounded-xl border border-white/10 bg-white/5">
                      <ShareButton url={link.url} title={link.title} description={link.description || undefined} variant="icon" />
                    </div>

                    <div className="hidden sm:block w-px h-6 bg-white/10 mx-1" />

                    {isOwner && (
                      <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-none">
                        <button
                          type="button"
                          onClick={() => setEditOpen(true)}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "lg" }),
                            "h-12 px-5 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase tracking-widest text-[11px] flex-1 sm:flex-none transition-all"
                          )}
                        >
                          <Pencil className="mr-2.5 h-4 w-4" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={onRefreshMetadata}
                          disabled={refreshing}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "lg" }),
                            "h-12 px-5 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase tracking-widest text-[11px] flex-1 sm:flex-none transition-all"
                          )}
                        >
                          <RefreshCw className={cn("mr-2.5 h-4 w-4", refreshing && "animate-spin")} />
                          Refresh
                        </button>

                        <button
                          type="button"
                          onClick={onRequestArchive}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "lg" }),
                            "h-12 px-5 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase tracking-widest text-[11px] flex-1 sm:flex-none transition-all"
                          )}
                        >
                          <Archive className="mr-2.5 h-4 w-4" />
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              {activeView === "preview" && (
                <p className="text-xl md:text-2xl lg:text-3xl text-slate-300/90 font-medium leading-relaxed tracking-tight">
                  {link.description || "No detailed description available for this curated asset."}
                </p>
              )}

              {activeView === "reader" && isOwner && (
                <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 md:p-12 shadow-inner">
                  {readerLoading && (
                    <div className="space-y-4">
                      <div className="h-8 w-3/4 bg-white/5 rounded-xl animate-pulse" />
                      <div className="h-4 w-full bg-white/5 rounded-lg animate-pulse" />
                      <div className="h-4 w-5/6 bg-white/5 rounded-lg animate-pulse" />
                    </div>
                  )}
                  {readerError && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                        <Globe className="h-6 w-6 text-rose-400" />
                      </div>
                      <p className="text-rose-400 font-bold uppercase tracking-widest text-sm mb-2">Extraction Failed</p>
                      <p className="text-slate-400 text-sm max-w-xs">{readerError}</p>
                    </div>
                  )}
                  {reader && (
                    <article className="max-w-3xl mx-auto">
                      <h2 className="text-2xl md:text-3xl font-black text-white mb-6 leading-tight">{reader.title || "Reader Extract"}</h2>
                      {reader.excerpt && (
                        <p className="text-lg text-slate-400 italic mb-8 border-l-2 border-primary/40 pl-6 py-1">
                          {reader.excerpt}
                        </p>
                      )}
                      <div className="mt-8 space-y-8 font-serif">
                        {reader.text.split("\n\n").slice(0, 40).map((p, idx) => (
                          <p key={idx} className="text-lg md:text-xl text-slate-200 leading-relaxed selection:bg-primary/30">
                            {p}
                          </p>
                        ))}
                        {reader.text.split("\n\n").length > 40 && (
                          <div className="pt-8 border-t border-white/10 text-center">
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                              Full content stored in archive snapshot
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="glass border border-white/10 rounded-[32px] p-2 sticky top-28 shadow-2xl bg-black/20 backdrop-blur-xl">
            <Tabs defaultValue="details" className="w-full" onValueChange={setActiveTab}>
              <TabsList
                variant="line"
                className={cn(
                  "w-full justify-start gap-1 p-1 rounded-[24px] border-none bg-transparent",
                  "flex flex-wrap"
                )}
              >
                <TabsTrigger value="details" className="flex-1 h-11 text-[10px] rounded-xl px-4 transition-all data-[state=active]:bg-white/10 data-[state=active]:shadow-lg">
                  <span className="font-black uppercase tracking-widest">Details</span>
                </TabsTrigger>
                {isOwner && (
                  <>
                    <TabsTrigger value="notes" className="flex-1 h-11 text-[10px] rounded-xl px-3 transition-all data-[state=active]:bg-white/10">
                      <StickyNote className="h-3.5 w-3.5 mr-1.5" />
                      <span className="hidden sm:inline font-black uppercase tracking-widest">Notes</span>
                    </TabsTrigger>
                    <TabsTrigger value="highlights" className="flex-1 h-11 text-[10px] rounded-xl px-3 transition-all data-[state=active]:bg-white/10">
                      <Highlighter className="h-3.5 w-3.5 mr-1.5" />
                      <span className="hidden sm:inline font-black uppercase tracking-widest">HLs</span>
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="flex-1 h-11 text-[10px] rounded-xl px-3 transition-all data-[state=active]:bg-white/10">
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      <span className="hidden sm:inline font-black uppercase tracking-widest">AI</span>
                    </TabsTrigger>
                    <TabsTrigger value="related" className="flex-1 h-11 text-[10px] rounded-xl px-3 transition-all data-[state=active]:bg-white/10">
                      <span className="font-black uppercase tracking-widest">Related</span>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              <div className="p-5 pt-4">
                <TabsContent value="details" className="mt-0 outline-hidden">
                  <DetailsPanel
                    link={link}
                    hostname={hostname}
                    isOwner={isOwner}
                    detailsLoading={detailsLoading}
                    tags={tags}
                    tagsSaving={tagsSaving}
                    onAddTag={addTag}
                    onRemoveTag={removeTag}
                    lastMetadataAt={lastMetadataAt}
                    archive={archive}
                  />
                </TabsContent>
                {isOwner && (
                  <>
                    <TabsContent value="notes">
                      <NotesPanel linkId={link.id} notes={notes} onNotesChange={setNotes} />
                    </TabsContent>
                    <TabsContent value="highlights">
                      <HighlightsPanel
                        linkId={link.id}
                        highlights={highlights}
                        onHighlightsChange={setHighlights}
                      />
                    </TabsContent>
                    <TabsContent value="history">
                      <HistoryPanel
                        linkId={link.id}
                        active={activeTab === "history"}
                        clicks={clicks}
                        onClicksChange={setClicks}
                      />
                    </TabsContent>
                    <TabsContent value="insights">
                      <InsightsPanel
                        linkId={link.id}
                        insights={insights}
                        onInsightsChange={setInsights}
                        tags={tags}
                        onTagsChange={setTagsState}
                      />
                    </TabsContent>
                    <TabsContent value="related">
                      <RelatedPanel
                        linkId={link.id}
                        active={activeTab === "related"}
                        related={related}
                        onRelatedChange={setRelated}
                      />
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {isOwner && (
        <EditLinkDialog
          link={{
            id: link.id,
            url: link.url,
            title: link.title,
            description: link.description,
            image: link.image,
            category: link.category,
          }}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}

function DetailsPanel({
  link,
  hostname,
  isOwner,
  detailsLoading,
  tags,
  tagsSaving,
  onAddTag,
  onRemoveTag,
  lastMetadataAt,
  archive,
}: {
  link: LinkDetailClientLink;
  hostname: string;
  isOwner: boolean;
  detailsLoading: boolean;
  tags: string[];
  tagsSaving: boolean;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  lastMetadataAt: string | null;
  archive: LinkArchive | null;
}) {
  const [tagDraft, setTagDraft] = React.useState("");

  return (
    <div className="space-y-8">
      {/* Source & Primary Actions */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
            <Image
              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
              width={28}
              height={28}
              alt=""
              unoptimized
              className="opacity-90"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Domain Source</p>
            <p className="text-xl font-black truncate text-white uppercase tracking-tight">{hostname}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase tracking-widest text-[10px] justify-center transition-all"
            )}
          >
            <Globe className="mr-2.5 h-4 w-4" />
            Visit
          </a>
          <ShareButton url={link.url} title={link.title} description={link.description || undefined} variant="full" className="w-full h-12 rounded-xl text-[10px]" />
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Curator Info */}
      <div className="rounded-2xl bg-primary/5 border border-primary/10 p-5 shadow-inner">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-3">Curated By</p>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden relative">
            {link.user.image ? (
              <Image src={link.user.image} alt={link.user.name || "Curator"} fill unoptimized />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[10px] font-black bg-primary/20 text-primary uppercase">
                {link.user.name?.slice(0, 2) || "LV"}
              </div>
            )}
          </div>
          <span className="text-sm font-black text-white tracking-tight">{link.user.name || "Anonymous Curator"}</span>
        </div>
      </div>

      {isOwner && (
        <div className="space-y-8">
          {/* Tags Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Tags</p>
              {tagsSaving && <span className="text-[10px] text-primary font-black uppercase tracking-widest animate-pulse">Saving…</span>}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 && (
                <span className="text-xs text-muted-foreground/60 font-medium italic">No tags assigned yet.</span>
              )}
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onRemoveTag(t)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-[10px] font-black tracking-tight hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all group"
                  title="Remove tag"
                  disabled={tagsSaving}
                >
                  <span className="opacity-40 group-hover:text-rose-400">#</span>
                  {t}
                  <span className="text-white/20 group-hover:text-rose-400">×</span>
                </button>
              ))}
            </div>

            <form
              className="relative"
              onSubmit={(e) => {
                e.preventDefault();
                onAddTag(tagDraft);
                setTagDraft("");
              }}
            >
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                placeholder="Add tag…"
                className="h-12 w-full rounded-xl bg-black/40 border border-white/10 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                disabled={detailsLoading || tagsSaving}
              />
              <button
                type="submit"
                className="absolute right-2 top-2 h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                disabled={detailsLoading || tagsSaving || !tagDraft.trim()}
              >
                Add
              </button>
            </form>
          </div>

          <div className="h-px bg-white/5" />

          {/* Metadata State */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Persistence State</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Metadata</span>
                <span className="text-[10px] font-black text-white/80">
                  {lastMetadataAt ? new Date(lastMetadataAt).toLocaleDateString() : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Snapshot</span>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  archive?.status === "completed" ? "text-emerald-400" : 
                  archive?.status === "failed" ? "text-rose-400" : "text-amber-400"
                )}>
                  {archive?.status ? String(archive.status) : "Idle"}
                </span>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Quick Navigation */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Management</p>
            <div className="flex flex-wrap gap-2">
              <NextLink
                href="/admin"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 flex-1 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all"
                )}
              >
                Dashboard
              </NextLink>
              <NextLink
                href="/admin/curation"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 flex-1 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-black text-[10px] uppercase tracking-widest transition-all"
                )}
              >
                Lab
              </NextLink>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderPanel({ title, description, icon: Icon }: { title: string; description: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 rounded-[24px] border border-dashed border-white/10 bg-white/5 text-center">
      {Icon && <Icon className="h-8 w-8 text-white/10 mb-4" />}
      <p className="text-xs font-black text-white uppercase tracking-widest mb-1">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function NotesPanel({
  linkId,
  notes,
  onNotesChange,
}: {
  linkId: string;
  notes: Array<{ id: string; body: string; createdAt: string; updatedAt: string }>;
  onNotesChange: (next: Array<{ id: string; body: string; createdAt: string; updatedAt: string }>) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const [saving, startTransition] = React.useTransition();

  const add = () => {
    startTransition(async () => {
      try {
        const res = await addLinkNote(linkId, draft);
        onNotesChange([res.note, ...notes]);
        setDraft("");
        toast.success("Note added.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add note");
      }
    });
  };

  const update = (id: string, body: string) => {
    startTransition(async () => {
      try {
        await updateLinkNote(linkId, id, body);
        onNotesChange(notes.map((n) => (n.id === id ? { ...n, body, updatedAt: new Date().toISOString() } : n)));
        toast.success("Note updated.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update note");
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      try {
        await deleteLinkNote(linkId, id);
        onNotesChange(notes.filter((n) => n.id !== id));
        toast.success("Note deleted.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete note");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 shadow-inner">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Add private note</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Jot down some context or takeaways…"
          className="w-full min-h-24 rounded-xl bg-black/40 border border-white/10 p-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          disabled={saving}
        />
        <div className="pt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-white/30">
            <Globe className="h-3 w-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Private</span>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={saving || draft.trim().length === 0}
            className={cn(buttonVariants({ size: "sm" }), "h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-widest transition-all")}
          >
            {saving ? "Saving…" : "Add Note"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {notes.length === 0 ? (
          <PlaceholderPanel icon={StickyNote} title="No Notes" description="Keep track of your thoughts about this link." />
        ) : (
          notes.map((n) => (
            <NoteItem key={n.id} note={n} disabled={saving} onUpdate={update} onDelete={remove} />
          ))
        )}
      </div>
    </div>
  );
}

function NoteItem({
  note,
  disabled,
  onUpdate,
  onDelete,
}: {
  note: { id: string; body: string; createdAt: string; updatedAt: string };
  disabled: boolean;
  onUpdate: (id: string, body: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(note.body);

  React.useEffect(() => setValue(note.body), [note.body]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">
          {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="h-7 w-7 rounded-lg border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            disabled={disabled}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            className="h-7 w-7 rounded-lg border border-white/10 flex items-center justify-center text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            disabled={disabled}
            title="Delete"
          >
            <Tags className="h-3.5 w-3.5 rotate-45" />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full min-h-20 rounded-xl bg-black/40 border border-white/10 p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            disabled={disabled}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onUpdate(note.id, value)}
              className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all"
              disabled={disabled || value.trim().length === 0 || value === note.body}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{note.body}</p>
      )}
    </div>
  );
}

function HighlightsPanel({
  linkId,
  highlights,
  onHighlightsChange,
}: {
  linkId: string;
  highlights: Array<{ id: string; quote: string; note?: string; createdAt: string }>;
  onHighlightsChange: (next: Array<{ id: string; quote: string; note?: string; createdAt: string }>) => void;
}) {
  const [quote, setQuote] = React.useState("");
  const [note, setNote] = React.useState("");
  const [saving, startTransition] = React.useTransition();

  const add = () => {
    startTransition(async () => {
      try {
        const res = await addLinkHighlight(linkId, { quote, note: note.trim() ? note : undefined });
        onHighlightsChange([res.highlight, ...highlights]);
        setQuote("");
        setNote("");
        toast.success("Highlight added.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add highlight");
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      try {
        await deleteLinkHighlight(linkId, id);
        onHighlightsChange(highlights.filter((h) => h.id !== id));
        toast.success("Highlight deleted.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete highlight");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 shadow-inner">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Clip from source</p>
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Paste a significant quote or insight…"
          className="w-full min-h-20 rounded-xl bg-black/40 border border-white/10 p-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          disabled={saving}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Context for this clip (optional)"
          className="mt-3 h-11 w-full rounded-xl bg-black/20 border border-white/10 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          disabled={saving}
        />
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={add}
            disabled={saving || quote.trim().length === 0}
            className={cn(buttonVariants({ size: "sm" }), "h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-widest transition-all")}
          >
            {saving ? "Saving…" : "Add Highlight"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {highlights.length === 0 ? (
          <PlaceholderPanel icon={Highlighter} title="No Highlights" description="Extract key insights directly from the content." />
        ) : (
          highlights.map((h) => (
            <div key={h.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/[0.07]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">
                  {new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <button
                  type="button"
                  onClick={() => remove(h.id)}
                  className="h-7 w-7 rounded-lg border border-white/10 flex items-center justify-center text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  disabled={saving}
                  title="Delete"
                >
                  <Tags className="h-3.5 w-3.5 rotate-45" />
                </button>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-serif selection:bg-primary/30">
                <span className="text-primary font-black mr-2">“</span>
                {h.quote}
                <span className="text-primary font-black ml-1">”</span>
              </p>
              {h.note && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Context</p>
                  <p className="text-xs text-slate-400 font-medium">{h.note}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function HistoryPanel({
  linkId,
  active,
  clicks,
  onClicksChange,
}: {
  linkId: string;
  active: boolean;
  clicks: Array<{ id: string; createdAt: string; referrer: string | null; country: string | null }> | null;
  onClicksChange: (next: Array<{ id: string; createdAt: string; referrer: string | null; country: string | null }> | null) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!active) return;
    if (clicks) return;
    setLoading(true);
    setError(null);
    getRecentClicks(linkId, 12)
      .then((res) => onClicksChange(res.clicks))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load history"))
      .finally(() => setLoading(false));
  }, [active, clicks, linkId, onClicksChange]);

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 shadow-inner">
        <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Engagement History</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Recent tracked visits and traffic sources for this asset.
        </p>
      </div>

      {loading && <PlaceholderPanel title="Loading…" description="Fetching recent activity." />}
      {error && <PlaceholderPanel title="Error" description={error} />}

      {clicks && clicks.length === 0 && <PlaceholderPanel icon={History} title="No Activity" description="Once someone opens this link, visits will appear here." />}
      
      {clicks && clicks.length > 0 && (
        <div className="space-y-3">
          {clicks.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4 transition-all hover:bg-white/[0.07]">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">
                  {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs font-black text-white/80 truncate">
                  {c.referrer || "Direct Access"}
                </p>
              </div>
              {c.country && (
                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/60">
                  {c.country}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightsPanel({
  linkId,
  insights,
  onInsightsChange,
  tags,
  onTagsChange,
}: {
  linkId: string;
  insights: LinkInsights | null;
  onInsightsChange: (next: LinkInsights | null) => void;
  tags: string[];
  onTagsChange: (next: string[]) => void;
}) {
  const [loading, startTransition] = React.useTransition();
  const [err, setErr] = React.useState<string | null>(null);

  const run = () => {
    startTransition(async () => {
      try {
        setErr(null);
        const next = await generateInsights(linkId);
        onInsightsChange(next);
        toast.success("Insights generated.");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to generate insights";
        setErr(msg);
        toast.error(msg);
      }
    });
  };

  const applyTags = () => {
    const suggested: string[] = insights?.suggestedTags ?? [];
    const merged = Array.from(new Set([...suggested.map((t) => String(t).toLowerCase().trim()).filter(Boolean), ...tags]));
    startTransition(async () => {
      try {
        const res = await setLinkTags(linkId, merged);
        onTagsChange(res.tags);
        toast.success("Tags applied.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to apply tags");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-black text-white uppercase tracking-widest mb-1">AI-Powered Synthesis</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Extract semantics, takeaways, and suggested tags.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className={cn(buttonVariants({ size: "sm" }), "h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-widest transition-all shrink-0")}
        >
          {loading ? "Thinking…" : "Generate"}
        </button>
      </div>

      {err && <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">{err}</div>}

      {!insights ? (
        <PlaceholderPanel icon={Sparkles} title="No Insights" description="Click generate to analyze this curated resource." />
      ) : (
        <div className="space-y-6">
          {insights.summary && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">Executive Summary</p>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">{String(insights.summary)}</p>
            </div>
          )}

          {Array.isArray(insights.keyTakeaways) && insights.keyTakeaways.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Core Takeaways</p>
              <ul className="space-y-4">
                {insights.keyTakeaways.slice(0, 8).map((t, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0 mt-2" />
                    {String(t)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.suggestedTags.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Suggested Taxonomy</p>
                <button
                  type="button"
                  onClick={applyTags}
                  disabled={loading}
                  className="h-8 px-3 rounded-lg border border-primary/20 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
                >
                  Apply All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {insights.suggestedTags.slice(0, 12).map((t) => (
                  <span
                    key={String(t)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-[10px] font-black tracking-tight"
                  >
                    <span className="opacity-40">#</span>
                    {String(t)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RelatedPanel({
  linkId,
  active,
  related,
  onRelatedChange,
}: {
  linkId: string;
  active: boolean;
  related: Array<{ id: string; slug: string | null; title: string; url: string; image: string | null; category: string | null; createdAt: string }> | null;
  onRelatedChange: (next: Array<{ id: string; slug: string | null; title: string; url: string; image: string | null; category: string | null; createdAt: string }> | null) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!active) return;
    if (related) return;
    setLoading(true);
    setError(null);
    getRelatedLinks(linkId, 6)
      .then((res) => onRelatedChange(res))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load related links"))
      .finally(() => setLoading(false));
  }, [active, linkId, onRelatedChange, related]);

  if (loading) return <PlaceholderPanel title="Analyzing Context…" description="Finding semantically related assets." />;
  if (error) return <PlaceholderPanel title="Error" description={error} />;

  if (!related || related.length === 0) {
    return <PlaceholderPanel icon={Network} title="Isolated Asset" description="As you curate more items, semantic relations will appear here." />;
  }

  return (
    <div className="space-y-3">
      {related.map((r) => (
        <NextLink
          key={r.id}
          href={`/links/${r.slug || r.id}`}
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.08] hover:border-white/20 transition-all shadow-sm"
        >
          <div className="h-14 w-14 rounded-xl bg-black/40 border border-white/10 overflow-hidden relative shrink-0 shadow-inner">
            {r.image ? (
              <Image src={r.image} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-white/10 uppercase">NA</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-sm text-white/90 truncate group-hover:text-primary transition-colors tracking-tight">{r.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">
                {r.category || "General"}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/10" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                {new Date(r.createdAt).toLocaleDateString("en-US", { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </NextLink>
      ))}
    </div>
  );
}
