import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AddLinkForm } from "@/components/admin/add-link-form";
import { LinkList } from "@/components/admin/link-list";
import { AdminStats } from "@/components/admin/admin-stats";
import { AnalyticsChart } from "@/components/admin/analytics-chart";
import { AnalyticsBreakdown } from "@/components/admin/analytics-breakdown";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getLinks } from "@/app/actions/links";
import { getAnalyticsData, getTotalClicks, getBreakdownData } from "@/app/actions/analytics";

type LinkListItem = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  category: string | null;
  status: string | null;
  createdAt: Date;
  clicks: number;
};

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [initialData, totalLinks, totalClicks, categoriesData, recentLinksCount, analyticsData, breakdownData] = await Promise.all([
    getLinks({ userId, limit: 15 }),
    prisma.link.count({ where: { userId } }),
    getTotalClicks(userId),
    prisma.link.groupBy({
      by: ["category"],
      where: { userId },
    }),
    prisma.link.count({
      where: {
        userId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    }),
    getAnalyticsData(userId),
    getBreakdownData(userId),
  ]);

  const allCategories = categoriesData
    .map((c) => c.category)
    .filter((c): c is string => !!c);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background opacity-50" />

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

          <AdminStats 
            totalLinks={totalLinks}
            totalCategories={categoriesData.length}
            recentLinksCount={recentLinksCount}
            totalClicks={totalClicks}
          />

          <AnalyticsChart data={analyticsData} />

          <AnalyticsBreakdown 
            devices={breakdownData.devices} 
            referrers={breakdownData.referrers} 
            countries={breakdownData.countries}
          />

          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <LinkList 
              userId={userId}
              initialLinks={initialData.links as LinkListItem[]} 
              initialNextCursor={initialData.nextCursor}
              categories={allCategories}
            />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
