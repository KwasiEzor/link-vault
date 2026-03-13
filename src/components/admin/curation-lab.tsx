"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Check, 
  X, 
  ArrowRight, 
  Loader2, 
  Tag, 
  MessageSquare,
  ExternalLink,
  Bot
} from "lucide-react";
import { approveEnrichment } from "@/app/actions/links";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type Link = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  category: string | null;
  aiSummary: string | null;
  aiCategory: string | null;
  enrichmentStatus: string | null;
};

export function CurationLab({ initialLinks }: { initialLinks: any[] }) {
  const [links, setLinks] = useState<Link[]>(initialLinks);

  const handleApprove = async (id: string) => {
    try {
      await approveEnrichment(id);
      setLinks(prev => prev.filter(l => l.id !== id));
      toast.success("Intelligence approved and synced!");
    } catch (error) {
      toast.error("Failed to approve enrichment.");
    }
  };

  const handleDiscard = async (id: string) => {
      // For now we just filter it out locally, but in a real app 
      // we'd probably reset the status to 'idle'
      setLinks(prev => prev.filter(l => l.id !== id));
      toast.success("Suggestion discarded.");
  };

  if (links.length === 0) {
    return (
      <div className="text-center py-32 glass rounded-[2.5rem] border-dashed border-white/10 shadow-inner">
        <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center text-primary/40 mx-auto mb-6 border border-primary/10">
            <Bot className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Lab is Quiet</h2>
        <p className="text-muted-foreground font-medium max-w-md mx-auto">
          No pending AI enrichments found. Add new links or trigger a "Re-Enrich" from the dashboard to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {links.map((link) => (
          <motion.div
            key={link.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-linear-to-r from-primary/20 via-indigo-500/20 to-violet-500/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            
            <Card className="glass border-white/5 overflow-hidden rounded-[2.5rem] relative bg-[#020617]/40">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  
                  {/* Preview Section */}
                  <div className="lg:col-span-3 h-full relative min-h-[200px] border-b lg:border-b-0 lg:border-r border-white/5">
                    {link.image ? (
                        <Image 
                            src={link.image} 
                            alt={link.title} 
                            fill 
                            className="object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" 
                        />
                    ) : (
                        <div className="h-full w-full bg-slate-900 flex items-center justify-center text-muted-foreground italic text-xs uppercase tracking-tighter">No Preview</div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 truncate font-bold text-xs text-white/80">
                        {new URL(link.url).hostname}
                    </div>
                  </div>

                  {/* Comparison Section */}
                  <div className="lg:col-span-6 p-8 space-y-8">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white">{link.title}</h3>
                            <a href={link.url} target="_blank" className="text-xs text-primary font-mono flex items-center gap-1 hover:underline">
                                <ExternalLink className="h-3 w-3" />
                                {link.url}
                            </a>
                        </div>
                        {link.enrichmentStatus === "pending" ? (
                            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2 animate-pulse">
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                <span className="text-[10px] font-black uppercase text-primary">Analyzing...</span>
                            </div>
                        ) : (
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                                <Sparkles className="h-3 w-3 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase text-emerald-500">Enriched</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4 opacity-40 grayscale group-hover:opacity-60 transition-opacity">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <Tag className="h-3 w-3" /> Original Data
                            </div>
                            <div className="space-y-3">
                                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">{link.category || "General"}</Badge>
                                <p className="text-sm font-medium leading-relaxed">{link.description || "No original description found."}</p>
                            </div>
                        </div>

                        <div className="space-y-4 bg-primary/5 p-6 rounded-3xl border border-primary/10">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                                <Sparkles className="h-3 w-3" /> AI Refinement
                            </div>
                            <div className="space-y-3">
                                <Badge className="bg-primary text-white text-[10px] uppercase font-black tracking-tighter shadow-lg shadow-primary/20">
                                    {link.aiCategory || "Categorizing..."}
                                </Badge>
                                <p className="text-sm font-bold text-white leading-relaxed italic">
                                    {link.aiSummary || "Developing summary..."}
                                </p>
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="lg:col-span-3 p-8 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col justify-center gap-3">
                    <Button 
                        onClick={() => handleApprove(link.id)}
                        disabled={link.enrichmentStatus === "pending"}
                        className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/10"
                    >
                        <Check className="mr-2 h-5 w-5" /> Approve
                    </Button>
                    <Button 
                        onClick={() => handleDiscard(link.id)}
                        variant="ghost" 
                        className="h-14 rounded-2xl text-muted-foreground hover:text-white hover:bg-white/5 font-bold"
                    >
                        <X className="mr-2 h-5 w-5" /> Discard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
