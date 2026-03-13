"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Link2, Sparkles, Pencil } from "lucide-react";
import { updateLink, getCategories } from "@/app/actions/links";
import { toast } from "sonner";

type Link = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  category: string | null;
};

export function EditLinkDialog({ 
  link, 
  open, 
  onOpenChange 
}: { 
  link: Link; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: link.title,
    description: link.description || "",
    category: link.category || "",
    url: link.url,
    image: link.image || "",
  });

  useEffect(() => {
    if (open) {
      getCategories().then(setExistingCategories);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateLink(link.id, formData);
      toast.success("Asset updated successfully!");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update asset";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 sm:max-w-137.5 overflow-hidden p-0">
        <form onSubmit={handleSubmit}>
          <div className="relative p-8 space-y-6">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10" />
            
            <DialogHeader className="relative">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-4">
                <Pencil className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">Edit Asset</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium pt-2">
                Modify the details of your curated asset.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Title
                </Label>
                <Input
                  id="title"
                  className="h-12 bg-white/5 border-white/5 focus:bg-white/10 focus:ring-primary/20 transition-all rounded-xl"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Description
                </Label>
                <Textarea
                  id="description"
                  className="min-h-25 bg-white/5 border-white/5 focus:bg-white/10 focus:ring-primary/20 transition-all rounded-xl"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="category" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Category
                  </Label>
                  <Input
                    id="category"
                    className="h-12 bg-white/5 border-white/5 focus:bg-white/10 focus:ring-primary/20 transition-all rounded-xl"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    list="edit-category-suggestions"
                  />
                  <datalist id="edit-category-suggestions">
                    {existingCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="url" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    URL
                  </Label>
                  <Input
                    id="url"
                    className="h-12 bg-white/5 border-white/5 focus:bg-white/10 focus:ring-primary/20 transition-all rounded-xl"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="image" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Preview Image URL
                </Label>
                <Input
                  id="image"
                  className="h-12 bg-white/5 border-white/5 focus:bg-white/10 focus:ring-primary/20 transition-all rounded-xl"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="bg-white/5 p-6 mt-0">
            <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20 transition-all" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Asset...
                </>
              ) : (
                "Update Asset"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
