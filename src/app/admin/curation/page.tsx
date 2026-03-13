import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CurationLab } from "@/components/admin/curation-lab";

export default async function CurationPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user?.id;

  if (!userId) {
    redirect("/login");
  }

  // Fetch all links that have AI suggestions or are pending
  const enrichedLinks = await prisma.link.findMany({
    where: {
      userId,
      OR: [
        { enrichmentStatus: "completed" },
        { enrichmentStatus: "pending" },
      ],
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background opacity-50" />

      <Navbar variant="admin" />

      <main className="container mx-auto px-6 py-12 min-h-[calc(100vh-200px)]">
        <div className="max-w-6xl mx-auto space-y-12">
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tight text-white italic">Curator's Lab</h1>
              <p className="text-muted-foreground font-medium">Review AI-powered refinements and approve intelligence.</p>
            </div>
          </section>

          <CurationLab initialLinks={enrichedLinks} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
