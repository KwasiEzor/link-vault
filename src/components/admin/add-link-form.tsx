"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Link2, Sparkles, AlertCircle } from "lucide-react";
import { addLink, getCategories } from "@/app/actions/links";
import { toast } from "sonner";
import { linkSchema, type LinkInput } from "@/lib/schemas";
import Image from "next/image";

export function AddLinkForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [metadata, setMetadata] = useState<{ title: string; image: string | null; description: string | null } | null>(null);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<LinkInput>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      url: "",
      category: "general",
    },
  });

  // Fetch existing categories when dialog opens
  useEffect(() => {
    if (open) {
      getCategories().then(setExistingCategories);
    }
  }, [open]);

  const urlValue = watch("url");

  // Fetch metadata preview when URL changes
  useEffect(() => {
    const fetchPreview = async () => {
      if (!urlValue || !urlValue.startsWith("http")) {
        setMetadata(null);
        return;
      }

      setFetchingMetadata(true);
      try {
        const res = await fetch(`/api/metadata?url=${encodeURIComponent(urlValue)}`);
        if (res.ok) {
          const data = await res.json();
          setMetadata(data);
        } else {
          setMetadata(null);
        }
      } catch (error) {
        setMetadata(null);
      } finally {
        setFetchingMetadata(false);
      }
    };

    const timer = setTimeout(fetchPreview, 1000);
    return () => clearTimeout(timer);
  }, [urlValue]);

  const onSubmit = async (data: LinkInput) => {
    setLoading(true);
    try {
      await addLink(data.url, data.category);
      toast.success("Asset curated successfully!");
      setOpen(false);
      reset();
      setMetadata(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to curate asset";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        reset();
        setMetadata(null);
      }
    }}>
      <DialogTrigger
        render={
          <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 group">
            <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" /> 
            Curate Link
          </Button>
        }
      />
      <DialogContent className="glass border-white/10 sm:max-w-lg overflow-hidden p-0">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="relative p-8 space-y-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10" />
            
            <DialogHeader className="relative">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">Curate New Asset</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium pt-2">
                Paste a URL below. We&apos;ll automatically extract the best preview for your vault.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="url" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Asset Destination
                  </Label>
                  {errors.url && (
                    <span className="text-[10px] text-destructive font-bold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.url.message}
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Link2 className="h-4 w-4" />
                  </div>
                  <Input
                    id="url"
                    {...register("url")}
                    placeholder="https://example.com/awesome-resource"
                    className={`pl-10 h-12 bg-white/5 border-white/5 focus:bg-white/10 focus:ring-primary/20 transition-all rounded-xl placeholder:text-muted-foreground/40 ${errors.url ? 'border-destructive/50' : ''}`}
                  />
                </div>
              </div>

              {/* Metadata Preview Area */}
              <div className="min-h-[100px] rounded-2xl border border-white/5 bg-white/5 overflow-hidden transition-all duration-500">
                {fetchingMetadata ? (
                  <div className="h-24 flex items-center justify-center gap-3 text-muted-foreground text-sm italic animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting metadata...
                  </div>
                ) : metadata ? (
                  <div className="flex gap-4 p-4 animate-in fade-in zoom-in-95 duration-300">
                    {metadata.image && (
                      <div className="relative h-20 w-32 shrink-0 rounded-lg overflow-hidden border border-white/10">
                        <Image src={metadata.image} alt="" fill className="object-cover" unoptimized />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-bold text-sm text-white truncate">{metadata.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{metadata.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-muted-foreground/30 text-xs font-medium px-8 text-center uppercase tracking-widest">
                    Metadata preview will appear here
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="category" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Vault Category
                </Label>
                <Input
                  id="category"
                  {...register("category")}
                  list="category-suggestions"
                  placeholder="e.g. Design, Research, Tools"
                  className="h-12 bg-white/5 border-white/5 focus:bg-white/10 focus:ring-primary/20 transition-all rounded-xl placeholder:text-muted-foreground/40"
                />
                <datalist id="category-suggestions">
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-white/5 p-6 mt-0">
            <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving to Vault...
                </>
              ) : (
                "Save to Vault"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
