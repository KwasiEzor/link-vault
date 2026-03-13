import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AddLinkForm } from "@/components/admin/add-link-form";
import { LinkList } from "@/components/admin/link-list";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const links = session.user?.id 
    ? await prisma.link.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="admin" />

      <main className="container mx-auto px-6 py-12 min-h-[calc(100vh-200px)]">
        <div className="max-w-6xl mx-auto space-y-12">
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tight text-white">Vault Management</h1>
              <p className="text-muted-foreground font-medium">Add, curate, and organize your digital assets.</p>
            </div>
            <AddLinkForm />
          </section>

          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <LinkList links={links as any} />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
