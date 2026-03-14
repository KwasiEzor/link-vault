import { getLinkBySlug } from "@/app/actions/links";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ExternalLink, 
  Calendar, 
  Tag, 
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ShareButton } from "@/components/share-button";
import { RecordVisit } from "@/components/record-visit";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);
  
  if (!link) return { title: "Link Not Found" };

  return {
    title: `${link.title} | LinkVault`,
    description: link.description || `Curated resource: ${link.title}`,
    openGraph: {
      images: link.image ? [link.image] : [],
    }
  };
}

export default async function LinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);

  if (!link) {
    notFound();
  }

  let hostname = "unknown";
  try {
    hostname = new URL(link.url).hostname.replace("www.", "");
  } catch {
    // If a bad URL makes it into the DB, don't crash the page render.
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <RecordVisit linkId={link.id} />
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50" />

      <Navbar variant="detail" />

      <main className="container mx-auto px-6 py-12 max-w-6xl min-h-[calc(100vh-200px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-12">
            {/* Image Hero */}
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
                <div className="flex items-center justify-center h-full text-slate-500 italic">
                  No preview available
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60" />
            </div>

            {/* Link Text Content */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
                  {link.title}
                </h1>
                <div className="flex flex-wrap gap-3 pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
                    <Tag className="h-3 w-3" />
                    {link.category || "General"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                    <Calendar className="h-3 w-3" />
                    {new Date(link.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-xl md:text-2xl text-slate-300 font-medium leading-relaxed">
                  {link.description || "No detailed description available for this curated asset."}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Actions/Meta */}
          <div className="space-y-8">
            <div className="glass border border-white/10 rounded-[32px] p-8 space-y-8 sticky top-28 shadow-xl">
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

                <div className="h-px w-full bg-white/5" />

                <div className="space-y-4">
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 text-lg"
                    )}
                  >
                    Visit Website
                    <ExternalLink className="ml-2 h-5 w-5" />
                  </a>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <ShareButton 
                      url={link.url}
                      title={link.title}
                      description={link.description || undefined}
                      variant="full"
                    />
                    <Link 
                      href={link.url}
                      target="_blank"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold group"
                      )}
                    >
                      <Globe className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                      Original
                    </Link>
                  </div>
                </div>
              </div>

              <div className="pt-4">
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
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
