"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Trash2, ExternalLink, MoreVertical, Calendar, Tag, Pencil } from "lucide-react";
import { deleteLink } from "@/app/actions/links";
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

type Link = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  category: string | null;
  createdAt: Date;
};

export function LinkList({ links }: { links: Link[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;
    
    setLoading(id);
    try {
      await deleteLink(id);
      toast.success("Link deleted successfully");
    } catch {
      toast.error("Failed to delete link");
    } finally {
      setLoading(null);
    }
  };

  if (links.length === 0) {
    return (
      <div className="text-center py-20 glass rounded-[2.5rem] border-dashed border-white/10 shadow-inner">
        <p className="text-xl font-bold text-muted-foreground italic">No links curated yet.</p>
        <p className="text-muted-foreground mt-2 opacity-60 font-medium">Add your first asset to see it here.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-[1.5rem] border-white/5 shadow-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-white/5 border-white/5 hover:bg-white/5">
            <TableHead className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Asset</TableHead>
            <TableHead className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Category</TableHead>
            <TableHead className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Curated</TableHead>
            <TableHead className="px-6 py-4 text-right font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors">
              <TableCell className="px-6 py-5">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-base tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                    {link.title}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[300px] opacity-60">
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
              <TableCell className="px-6 py-5 text-muted-foreground text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 opacity-40" />
                  {new Date(link.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </TableCell>
              <TableCell className="px-6 py-5 text-right">
                <div className="flex justify-end gap-1">
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-white/5">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="glass border-white/10 min-w-[160px]">
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive font-medium"
                        onClick={() => handleDelete(link.id)}
                        disabled={loading === link.id}
                        variant="destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {loading === link.id ? "Removing..." : "Remove Asset"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="font-medium"
                        onClick={() => setEditingLink(link)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Asset
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
