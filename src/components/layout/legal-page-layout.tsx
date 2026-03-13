import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

interface PageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, description, children }: PageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar variant="detail" />
      <main className="flex-1 container mx-auto px-6 py-20 max-w-4xl">
        <header className="mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            {title}
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            {description}
          </p>
          <div className="h-1 w-20 bg-primary/50 rounded-full" />
        </header>
        <div className="prose prose-invert prose-primary max-w-none space-y-8 text-muted-foreground leading-relaxed">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
