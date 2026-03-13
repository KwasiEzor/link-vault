import { getLinks, getCategories } from "@/app/actions/links";
import { LinkExplorer } from "@/components/link-explorer";
import { LogIn, Sparkles } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function Home() {
  const { links, nextCursor } = await getLinks({ limit: 9 });
  const categories = await getCategories();

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/5 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">
              Link<span className="bg-gradient-to-r from-primary via-indigo-400 to-violet-500 bg-clip-text text-transparent font-black">Vault</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              href="/login" 
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-primary transition-colors font-medium"
              )}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Admin Access
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20 md:py-32">
        {/* Hero Section */}
        <section className="relative max-w-4xl mx-auto text-center mb-32 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest animate-float">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Personal Collection 2026
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9]">
            Visualizing <br />
            <span className="bg-gradient-to-r from-primary via-indigo-400 to-violet-500 bg-clip-text text-transparent">
              Knowledge.
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            A minimalist workspace for curated digital resources, <br className="hidden md:block" />
            designed for focus and inspiration.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?u=${i}`} alt="" />
                </div>
              ))}
              <div className="h-10 w-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">
                +1k
              </div>
            </div>
            <div className="h-px w-8 bg-border hidden sm:block" />
            <p className="text-sm text-muted-foreground font-medium">
              Trusted by digital curators worldwide
            </p>
          </div>
        </section>

        {/* Links Grid */}
        <LinkExplorer 
          initialLinks={links} 
          initialNextCursor={nextCursor} 
          initialCategories={categories} 
        />
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-20 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-muted-foreground text-sm font-medium">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">V</div>
          <span>&copy; {new Date().getFullYear()} Vault. Private Workspace.</span>
        </div>
        
        <div className="flex items-center gap-8">
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Security</a>
          <a href="#" className="hover:text-primary transition-colors">Open Source</a>
        </div>
      </footer>
    </div>
  );
}
