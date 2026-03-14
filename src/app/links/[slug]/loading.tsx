import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50" />

      <Navbar variant="detail" />

      <main className="container mx-auto px-6 py-12 max-w-6xl min-h-[calc(100vh-200px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            <div className="relative aspect-video w-full rounded-[32px] overflow-hidden border border-white/10 shadow-2xl bg-white/5">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
            </div>

            <div className="space-y-5">
              <div className="h-12 w-5/6 rounded-2xl bg-white/5 animate-pulse" />
              <div className="flex gap-3">
                <div className="h-6 w-24 rounded-full bg-white/5 animate-pulse" />
                <div className="h-6 w-28 rounded-full bg-white/5 animate-pulse" />
              </div>
              <div className="space-y-3 pt-2">
                <div className="h-6 w-full rounded-xl bg-white/5 animate-pulse" />
                <div className="h-6 w-11/12 rounded-xl bg-white/5 animate-pulse" />
                <div className="h-6 w-10/12 rounded-xl bg-white/5 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass border border-white/10 rounded-[32px] p-8 space-y-6 sticky top-28 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
                  <div className="h-5 w-32 rounded bg-white/5 animate-pulse" />
                </div>
              </div>
              <div className="h-px w-full bg-white/5" />
              <div className="space-y-3">
                <div className="h-14 w-full rounded-2xl bg-white/5 animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-12 rounded-xl bg-white/5 animate-pulse" />
                  <div className="h-12 rounded-xl bg-white/5 animate-pulse" />
                </div>
              </div>
              <div className="h-20 rounded-2xl bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
      </main>

      <Footer variant="compact" />
    </div>
  );
}

