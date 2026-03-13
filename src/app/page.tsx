import { getLinks, getCategories } from "@/app/actions/links";
import { LinkExplorer } from "@/components/link-explorer";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ q?: string; c?: string }> }
): Promise<Metadata> {
  const { q, c } = await searchParams;
  const title = c && c !== "all" ? `${c} Assets | LinkVault` : q ? `Search: ${q} | LinkVault` : "LinkVault | Personal Link Manager";
  
  return {
    title,
    description: "A minimalist workspace for curated digital resources.",
  };
}

export default async function Home() {
  const { links, nextCursor } = await getLinks({ limit: 9 });
  const categories = await getCategories();

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30">
      <Navbar />

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
                <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold overflow-hidden relative">
                  <Image 
                    src={`https://i.pravatar.cc/100?u=${i}`} 
                    alt={`User ${i}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
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

      <Footer />
    </div>
  );
}
