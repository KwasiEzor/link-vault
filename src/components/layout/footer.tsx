import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Github, Twitter, Linkedin, Globe } from "lucide-react";

export function Footer({ variant = "full" }: { variant?: "full" | "compact" }) {
  return (
    <footer className="relative mt-20 border-t border-white/5 bg-background/50 backdrop-blur-md">
      {variant === "full" && (
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-2 space-y-6">
              <Logo iconClassName="h-8 w-8" textClassName="text-lg" />
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs font-medium">
                A premium, minimalist workspace for digital curators.
                Organizing the web&apos;s best resources with focus and visual clarity.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="https://github.com"
                  target="_blank"
                  className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all group"
                >
                  <Github className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </Link>
                <Link
                  href="https://twitter.com"
                  target="_blank"
                  className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all group"
                >
                  <Twitter className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </Link>
                <Link
                  href="https://linkedin.com"
                  target="_blank"
                  className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all group"
                >
                  <Linkedin className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Links Column 1 */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Resources</h4>
              <ul className="space-y-4">
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-white transition-colors font-medium">
                    The Vault
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-white transition-colors font-medium">
                    Admin Console
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="text-sm text-muted-foreground hover:text-white transition-colors font-medium">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            {/* Links Column 2 */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Legal</h4>
              <ul className="space-y-4">
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-white transition-colors font-medium">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-white transition-colors font-medium">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-sm text-muted-foreground hover:text-white transition-colors font-medium">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <BottomBar />
        </div>
      )}

      {variant === "compact" && (
        <div className="container mx-auto px-6 py-8">
          <BottomBar />
        </div>
      )}

      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-linear-to-r from-transparent via-primary/50 to-transparent blur-sm" />
    </footer>
  );
}

function BottomBar() {
  return (
    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-tight uppercase">
        <span className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center text-primary font-black">V</span>
        &copy; {new Date().getFullYear()} Vault. All Rights Reserved.
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Systems Operational
        </div>
        <div className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest cursor-default">
          <Globe className="h-3 w-3" />
          EN-US
        </div>
      </div>
    </div>
  );
}
