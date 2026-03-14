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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <div className="relative aspect-video w-full rounded-[32px] overflow-hidden border border-white/10 shadow-2xl group bg-slate-900">
            {link.image ? (
              <Image
                src={link.image}
                alt={link.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 italic">No preview available</div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60" />

            <div className="absolute left-6 right-6 bottom-6 flex flex-col gap-3">
              <div className="inline-flex w-fit rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 p-1">
                <button
                  type="button"
                  className={cn(
                    "h-9 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors",
                    activeView === "preview" ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
                  )}
                  onClick={() => setActiveView("preview")}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className={cn(
                    "h-9 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors",
                    activeView === "reader" ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
                  )}
                  onClick={() => setActiveView("reader")}
                >
                  Reader
                </button>
              </div>
              {activeView === "reader" && (
                <div className="rounded-2xl bg-black/45 border border-white/10 backdrop-blur-md p-4 text-sm text-slate-200">
                  {!isOwner && (
                    <p className="font-medium text-slate-200">
                      Reader mode is available for the curator only.
                    </p>
                  )}
                  {isOwner && (
                    <div className="space-y-2">
                      {readerLoading && <p className="font-medium">Extracting readable content…</p>}
                      {readerError && <p className="font-medium text-rose-300">{readerError}</p>}
                      {reader && (
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                            {reader.wordCount.toLocaleString("en-US")} words
                          </span>
                          <button
                            type="button"
                            onClick={createHighlightFromSelection}
                            className={cn(
                              buttonVariants({ variant: "outline" }),
                              "h-9 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold text-xs"
                            )}
                          >
                            <Highlighter className="mr-2 h-4 w-4" />
                            Highlight Selection
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
                {link.title}
              </h1>

              <div className="flex flex-wrap gap-3 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
                  <Tags className="h-3 w-3" />
                  {link.category || "General"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                  <Calendar className="h-3 w-3" />
                  {createdLabel}
                </span>
                {typeof link.enrichmentStatus === "string" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                    <Network className="h-3 w-3" />
                    {link.enrichmentStatus}
                  </span>
                )}
              </div>

              <div className="sticky top-16 z-30 -mx-2">
                <div className="mx-2 rounded-2xl bg-background/60 border border-white/10 backdrop-blur-xl shadow-xl p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm"
                      )}
                    >
                      Open
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>

                    <button
                      type="button"
                      onClick={copyUrl}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-11 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold"
                      )}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </button>

                    <div className="h-11 flex items-center px-2 rounded-xl border border-white/10 bg-white/5">
                      <ShareButton url={link.url} title={link.title} description={link.description || undefined} variant="icon" />
                    </div>

                    {isOwner && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditOpen(true)}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-11 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold"
                          )}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={onRefreshMetadata}
                          disabled={refreshing}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-11 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold"
                          )}
                        >
                          <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                          Refresh
                        </button>

                        <button
                          type="button"
                          onClick={onRequestArchive}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-11 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold"
                          )}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              {activeView === "preview" && (
                <p className="text-xl md:text-2xl text-slate-300 font-medium leading-relaxed">
                  {link.description || "No detailed description available for this curated asset."}
                </p>
              )}

              {activeView === "reader" && isOwner && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  {readerLoading && <div className="h-6 w-48 bg-white/5 rounded-lg animate-pulse" />}
                  {readerError && <p className="text-rose-300 font-medium">{readerError}</p>}
                  {reader && (
                    <>
                      <h2 className="text-lg font-black text-white mb-3">{reader.title || "Reader Extract"}</h2>
                      {reader.excerpt && <p className="text-slate-300">{reader.excerpt}</p>}
                      <div className="mt-4 space-y-4">
                        {reader.text.split("\n\n").slice(0, 40).map((p, idx) => (
                          <p key={idx} className="text-slate-200 leading-relaxed">
                            {p}
                          </p>
                        ))}
                        {reader.text.split("\n\n").length > 40 && (
                          <p className="text-muted-foreground text-sm font-medium">
                            Showing first 40 paragraphs. Use Archive to store the full snapshot.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass border border-white/10 rounded-[32px] p-6 sticky top-28 shadow-xl">
            <Tabs defaultValue="details" className="w-full" onValueChange={setActiveTab}>
              <TabsList
                variant="line"
                className="w-full justify-start gap-1 px-1 py-1 bg-transparent overflow-x-auto no-scrollbar"
              >
                <TabsTrigger value="details" className="text-xs">
                  Details
                </TabsTrigger>
                {isOwner && (
                  <>
                    <TabsTrigger value="notes" className="text-xs">
                      <StickyNote className="h-4 w-4" />
                      Notes
                    </TabsTrigger>
                    <TabsTrigger value="highlights" className="text-xs">
                      <Highlighter className="h-4 w-4" />
                      Highlights
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-xs">
                      <History className="h-4 w-4" />
                      History
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="text-xs">
                      <Sparkles className="h-4 w-4" />
                      Insights
                    </TabsTrigger>
                    <TabsTrigger value="related" className="text-xs">
                      Related
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              <div className="pt-6">
                <TabsContent value="details">
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
          <Image
            src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
            width={24}
            height={24}
            alt=""
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-0.5">Source</p>
          <p className="text-lg font-bold truncate text-white uppercase">{hostname}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-11 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold justify-center"
          )}
        >
          <Globe className="mr-2 h-4 w-4" />
          Visit
        </a>
        <ShareButton url={link.url} title={link.title} description={link.description || undefined} variant="full" className="w-full" />
      </div>

      <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Curated By</p>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-800 overflow-hidden relative">
            {link.user.image ? (
              <Image src={link.user.image} alt={link.user.name || "Curator"} fill unoptimized />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[10px] font-bold">LV</div>
            )}
          </div>
          <span className="text-sm font-bold text-white">{link.user.name || "Anonymous Curator"}</span>
        </div>
      </div>

      {isOwner && (
        <>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 && (
                <span className="text-sm text-muted-foreground font-medium">No tags yet.</span>
              )}
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onRemoveTag(t)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/90 text-[11px] font-black tracking-tight hover:bg-white/10"
                  title="Remove tag"
                  disabled={tagsSaving}
                >
                  <span className="opacity-80">#</span>
                  {t}
                  <span className="text-white/50">×</span>
                </button>
              ))}
            </div>

            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                onAddTag(tagDraft);
                setTagDraft("");
              }}
            >
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                placeholder="Add tag (enter)"
                className="h-10 w-full rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={detailsLoading || tagsSaving}
              />
              <button
                type="submit"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold shrink-0"
                )}
                disabled={detailsLoading || tagsSaving}
              >
                Add
              </button>
            </form>
            {tagsSaving && <p className="text-[11px] text-muted-foreground font-medium mt-2">Saving…</p>}
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">State</p>
            <div className="text-sm text-white/90 font-medium space-y-1">
              <p>
                Metadata:{" "}
                <span className="text-white/70">
                  {lastMetadataAt ? new Date(lastMetadataAt).toLocaleString("en-US") : "unknown"}
                </span>
              </p>
              <p>
                Archive:{" "}
                <span className="text-white/70">{archive?.status ? String(archive.status) : "idle"}</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Quick Links</p>
            <div className="flex flex-wrap gap-2">
              <NextLink
                href="/admin"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold"
                )}
              >
                Dashboard
              </NextLink>
              <NextLink
                href="/admin/curation"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold"
                )}
              >
                Curator&apos;s Lab
              </NextLink>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PlaceholderPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="text-sm text-muted-foreground font-medium pt-1">{description}</p>
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
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">New note</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a note…"
          className="w-full min-h-24 rounded-2xl bg-black/20 border border-white/10 p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          disabled={saving}
        />
        <div className="pt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground font-medium">Notes are private to you.</p>
          <button
            type="button"
            onClick={add}
            disabled={saving || draft.trim().length === 0}
            className={cn(buttonVariants({ size: "lg" }), "h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold")}
          >
            Add note
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <PlaceholderPanel title="No notes yet" description="Add context, next steps, or why this link matters." />
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <NoteItem key={n.id} note={n} disabled={saving} onUpdate={update} onDelete={remove} />
          ))}
        </div>
      )}
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
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest">
            {new Date(note.createdAt).toLocaleString("en-US")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold text-xs")}
            disabled={disabled}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {editing ? "Done" : "Edit"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold text-xs")}
            disabled={disabled}
          >
            Delete
          </button>
        </div>
      </div>

      {editing ? (
        <div className="pt-3 space-y-3">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full min-h-20 rounded-2xl bg-black/20 border border-white/10 p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => onUpdate(note.id, value)}
            className={cn(buttonVariants({ size: "lg" }), "h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold")}
            disabled={disabled || value.trim().length === 0 || value === note.body}
          >
            Save changes
          </button>
        </div>
      ) : (
        <p className="pt-3 text-sm text-slate-200 whitespace-pre-wrap">{note.body}</p>
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
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">New highlight</p>
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Paste or type a quote… (Tip: in Reader view, select text then click Highlight Selection)"
          className="w-full min-h-20 rounded-2xl bg-black/20 border border-white/10 p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          disabled={saving}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          className="mt-3 h-10 w-full rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
          disabled={saving}
        />
        <div className="pt-3 flex justify-end">
          <button
            type="button"
            onClick={add}
            disabled={saving || quote.trim().length === 0}
            className={cn(buttonVariants({ size: "lg" }), "h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold")}
          >
            Add highlight
          </button>
        </div>
      </div>

      {highlights.length === 0 ? (
        <PlaceholderPanel title="No highlights yet" description="Highlights help you build a personal knowledge base from the web." />
      ) : (
        <div className="space-y-3">
          {highlights.map((h) => (
            <div key={h.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest">
                  {new Date(h.createdAt).toLocaleString("en-US")}
                </p>
                <button
                  type="button"
                  onClick={() => remove(h.id)}
                  className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold text-xs")}
                  disabled={saving}
                >
                  Delete
                </button>
              </div>
              <p className="pt-3 text-sm text-slate-200 whitespace-pre-wrap">
                <span className="text-primary font-black">“</span>
                {h.quote}
                <span className="text-primary font-black">”</span>
              </p>
              {h.note && <p className="pt-2 text-sm text-white/70 font-medium">{h.note}</p>}
            </div>
          ))}
        </div>
      )}
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
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-black text-white">Recent visits</p>
        <p className="text-sm text-muted-foreground font-medium pt-1">
          Shows the most recent tracked visits (best-effort).
        </p>
      </div>

      {loading && <PlaceholderPanel title="Loading…" description="Fetching recent visits." />}
      {error && <PlaceholderPanel title="Could not load history" description={error} />}

      {clicks && clicks.length === 0 && <PlaceholderPanel title="No visits yet" description="Once someone opens this link page, visits will appear here." />}
      {clicks && clicks.length > 0 && (
        <div className="space-y-3">
          {clicks.map((c) => (
            <div key={c.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest">
                {new Date(c.createdAt).toLocaleString("en-US")}
              </p>
              <p className="pt-2 text-sm text-white/80 font-medium truncate">
                Referrer: {c.referrer || "direct"}
              </p>
              {c.country && (
                <p className="pt-1 text-xs text-white/60 font-bold uppercase tracking-widest">
                  {c.country}
                </p>
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
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">AI Insights</p>
          <p className="text-sm text-muted-foreground font-medium pt-1">
            Generates a concise summary, takeaways, and suggested tags.
          </p>
          {err && <p className="pt-2 text-sm text-rose-300 font-medium">{err}</p>}
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className={cn(buttonVariants({ size: "lg" }), "h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shrink-0")}
        >
          {loading ? "Working…" : "Generate"}
        </button>
      </div>

      {!insights ? (
        <PlaceholderPanel title="No insights yet" description="Click Generate to create insights for this resource." />
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-4">
          {insights.summary && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Summary</p>
              <p className="pt-2 text-sm text-slate-200 font-medium">{String(insights.summary)}</p>
            </div>
          )}

          {Array.isArray(insights.keyTakeaways) && insights.keyTakeaways.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Key takeaways</p>
              <ul className="pt-2 space-y-2">
                {insights.keyTakeaways.slice(0, 8).map((t, idx) => (
                  <li key={idx} className="text-sm text-slate-200 font-medium">
                    {String(t)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.suggestedTags.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Suggested tags</p>
                <button
                  type="button"
                  onClick={applyTags}
                  disabled={loading}
                  className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold text-xs")}
                >
                  Apply tags
                </button>
              </div>
              <div className="pt-2 flex flex-wrap gap-2">
                {insights.suggestedTags.slice(0, 12).map((t) => (
                  <span
                    key={String(t)}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/90 text-[11px] font-black tracking-tight"
                  >
                    <span className="opacity-80">#</span>
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

  if (loading) return <PlaceholderPanel title="Loading…" description="Finding related assets." />;
  if (error) return <PlaceholderPanel title="Could not load related assets" description={error} />;

  if (!related || related.length === 0) {
    return <PlaceholderPanel title="No related assets yet" description="As you curate more links, related items will show up here." />;
  }

  return (
    <div className="space-y-3">
      {related.map((r) => (
        <NextLink
          key={r.id}
          href={`/links/${r.slug || r.id}`}
          className="group flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors"
        >
          <div className="h-12 w-12 rounded-2xl bg-black/20 border border-white/10 overflow-hidden relative shrink-0">
            {r.image ? <Image src={r.image} alt="" fill className="object-cover" unoptimized /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-sm text-white truncate group-hover:text-primary transition-colors">{r.title}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {r.category || "general"} • {new Date(r.createdAt).toLocaleDateString("en-US")}
            </p>
          </div>
        </NextLink>
      ))}
    </div>
  );
}
