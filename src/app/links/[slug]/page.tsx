import { getLinkBySlug } from "@/app/actions/links";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { RecordVisit } from "@/components/record-visit";
import { auth } from "@/auth";
import { LinkDetailClient } from "@/components/link-detail/link-detail-client";
import { ReadingProgress } from "@/components/link-detail/reading-progress";
import { JumpToTop } from "@/components/link-detail/jump-to-top";

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
  const session = await auth();

  if (!link) {
    notFound();
  }

  let hostname = "unknown";
  try {
    hostname = new URL(link.url).hostname.replace("www.", "");
  } catch {
    // If a bad URL makes it into the DB, don't crash the page render.
  }

  const isOwner = !!session?.user?.id && session.user.id === link.userId;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <RecordVisit linkId={link.id} />
      <ReadingProgress />
      <JumpToTop />
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50" />

      <Navbar variant="detail" />

      <main className="container mx-auto px-6 py-12 max-w-6xl min-h-[calc(100vh-200px)]">
        <LinkDetailClient
          hostname={hostname}
          isOwner={isOwner}
          link={{
            id: link.id,
            userId: link.userId,
            url: link.url,
            title: link.title,
            description: link.description,
            image: link.image,
            category: link.category,
            status: link.status,
            enrichmentStatus: link.enrichmentStatus,
            createdAt: link.createdAt.toISOString(),
            updatedAt: link.updatedAt.toISOString(),
            slug: link.slug,
            user: link.user,
            // Future: tags/notes/highlights/insights/archive will be loaded from DB fields.
          }}
        />
      </main>

      <Footer variant="compact" />
    </div>
  );
}
