"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getSettings } from "@/app/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background opacity-50" />

      <Navbar variant="admin" />

      <main className="container mx-auto px-6 py-12 min-h-[calc(100vh-200px)]">
        <div className="max-w-4xl mx-auto space-y-12">
          <section className="space-y-1 pb-8 border-b border-white/5">
            <h1 className="text-4xl font-black tracking-tight text-white">System Settings</h1>
            <p className="text-muted-foreground font-medium">Configure AI enrichment and background tasks.</p>
          </section>

          <SettingsForm initialSettings={settings} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
