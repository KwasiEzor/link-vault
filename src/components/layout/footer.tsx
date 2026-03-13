import Link from "next/link";

export function Footer() {
  return (
    <footer className="container mx-auto px-6 py-20 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-muted-foreground text-sm font-medium">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">V</div>
        <span>&copy; {new Date().getFullYear()} Vault. Private Workspace.</span>
      </div>
      
      <div className="flex items-center gap-8">
        <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
        <Link href="#" className="hover:text-primary transition-colors">Security</Link>
        <Link href="https://github.com" target="_blank" className="hover:text-primary transition-colors">Open Source</Link>
      </div>
    </footer>
  );
}
