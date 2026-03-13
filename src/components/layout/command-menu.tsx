"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList,
  CommandSeparator,
  CommandShortcut
} from "@/components/ui/command";
import { 
  LayoutDashboard, 
  Plus, 
  Search, 
  Home, 
  LogOut, 
  Link2,
  ExternalLink,
  Copy,
  TrendingUp,
  Tags
} from "lucide-react";
import { getLinks } from "@/app/actions/links";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Link = {
  id: string;
  title: string;
  url: string;
  slug: string | null;
  category: string | null;
};

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [links, setLinks] = React.useState<Link[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch links when search changes or menu opens
  React.useEffect(() => {
    if (!open) return;

    const fetchLinks = async () => {
      setLoading(true);
      try {
        const result = await getLinks({ search: search, limit: 10 });
        setLinks(result.links as Link[]);
      } catch (error) {
        console.error("Command palette fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchLinks, 300);
    return () => clearTimeout(timer);
  }, [search, open]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={setOpen}
      className="glass border-white/10 shadow-2xl overflow-hidden rounded-3xl!"
    >
      <div className="relative group/input">
        <CommandInput 
          placeholder="Type a command or search assets..." 
          value={search}
          onValueChange={setSearch}
          className="h-14 px-4 text-base bg-transparent border-none focus:ring-0"
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      </div>
      
      <CommandList className="max-h-[450px] p-2 no-scrollbar">
        <CommandEmpty className="py-12 flex flex-col items-center gap-4 text-muted-foreground italic">
          <Search className="h-8 w-8 opacity-20" />
          No results found for your query.
        </CommandEmpty>

        {links.length > 0 && (
          <CommandGroup heading="Assets" className="px-2">
            {links.map((link) => (
              <CommandItem
                key={link.id}
                value={link.title + link.url + (link.category || "")}
                onSelect={() => runCommand(() => router.push(`/links/${link.slug || link.id}`))}
                className="group flex items-center justify-between py-3 px-4 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Link2 className="h-5 w-5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm tracking-tight truncate group-hover:text-primary transition-colors">
                      {link.title}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold opacity-60">
                      {link.category || "General"}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button
                    onClick={(e) => {
                      e.stopPropagation();
                      runCommand(() => copyUrl(link.url));
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white"
                   >
                     <Copy className="h-4 w-4" />
                   </button>
                   <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(link.url, "_blank");
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white"
                   >
                     <ExternalLink className="h-4 w-4" />
                   </button>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator className="my-2 bg-white/5" />

        <CommandGroup heading="Management" className="px-2">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/admin"))}
            className="py-3 px-4 rounded-2xl cursor-pointer hover:bg-white/5"
          >
            <LayoutDashboard className="mr-4 h-5 w-5 text-indigo-400" />
            <span className="font-bold">Admin Console</span>
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
                setOpen(false);
                // Trigger the add link form dialog somehow? 
                // For now just redirect to admin
                router.push("/admin");
            }}
            className="py-3 px-4 rounded-2xl cursor-pointer hover:bg-white/5"
          >
            <Plus className="mr-4 h-5 w-5 text-emerald-400" />
            <span className="font-bold">Curate New Asset</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-2 bg-white/5" />

        <CommandGroup heading="System" className="px-2">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/"))}
            className="py-3 px-4 rounded-2xl cursor-pointer hover:bg-white/5"
          >
            <Home className="mr-4 h-5 w-5 text-slate-400" />
            <span className="font-bold">Go to Vault Home</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/admin?trending=true"))}
            className="py-3 px-4 rounded-2xl cursor-pointer hover:bg-white/5"
          >
            <TrendingUp className="mr-4 h-5 w-5 text-orange-400" />
            <span className="font-bold">View Engagement Data</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
      
      <div className="bg-white/5 px-4 py-3 flex items-center justify-between border-t border-white/5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Press <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 text-white font-mono">ESC</kbd> to close
        </p>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-mono">↑↓</kbd>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-mono">↵</kbd>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Select</span>
            </div>
        </div>
      </div>
    </CommandDialog>
  );
}
