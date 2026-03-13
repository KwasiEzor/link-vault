import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AddLinkForm } from "@/components/admin/add-link-form";
import { LinkList } from "@/components/admin/link-list";
import { LogOut, ExternalLink, Sparkles } from "lucide-react";
import { signOut } from "@/auth";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

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
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">Admin Console</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Live Site
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <form action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}>
              <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tight">Vault Management</h1>
              <p className="text-muted-foreground font-medium">Add, curate, and organize your digital assets.</p>
            </div>
            <AddLinkForm />
          </section>

          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <LinkList links={links} />
          </section>
        </div>
      </main>
    </div>
  );
}
