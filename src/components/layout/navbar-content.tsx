"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { 
  LogIn, 
  LayoutDashboard, 
  LogOut, 
  ArrowLeft, 
  Sparkles, 
  Settings, 
  Menu, 
  X,
  User
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CommandTrigger } from "./command-trigger";
import { logout } from "@/app/actions/auth";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

interface NavbarContentProps {
  variant?: "public" | "admin" | "detail";
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      id?: string;
    } | null;
  } | null;
}

export function NavbarContent({ variant = "public", session }: NavbarContentProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const navLinks = [
    { 
      href: "/admin", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      active: pathname === "/admin",
      color: "hover:text-primary"
    },
    { 
      href: "/admin/curation", 
      label: "Curator's Lab", 
      icon: Sparkles,
      active: pathname === "/admin/curation",
      color: "hover:text-violet-400"
    },
    { 
      href: "/admin/settings", 
      label: "Settings", 
      icon: Settings,
      active: pathname === "/admin/settings",
      color: "hover:text-indigo-400"
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/5 backdrop-blur-xl border-b border-white/5">
      <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-8">
          {variant === "detail" ? (
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden xs:inline">Back to Vault</span>
            </Link>
          ) : (
            <Logo className="scale-90 sm:scale-100 origin-left" />
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-2 sm:gap-4">
          <CommandTrigger />
          
          {session ? (
            <div className="flex items-center gap-1 sm:gap-3">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "text-muted-foreground transition-colors font-medium px-2 sm:px-3",
                    link.color,
                    link.active && "text-primary bg-primary/5"
                  )}
                  title={link.label}
                >
                  <link.icon className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              ))}
              
              <div className="h-4 w-px bg-white/10 mx-1" />
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logout()}
                className="text-muted-foreground hover:text-destructive transition-colors font-medium px-2 sm:px-3"
                title="Logout"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-primary transition-colors font-medium"
              )}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Admin Access
            </Link>
          )}
        </div>

        {/* Mobile/Tablet Controls */}
        <div className="flex lg:hidden items-center gap-2">
            <CommandTrigger />
            {session ? (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggleMobileMenu}
                    className="text-white hover:bg-white/10"
                >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            ) : (
                <Link 
                    href="/login" 
                    className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                >
                    <LogIn className="h-5 w-5" />
                </Link>
            )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && session && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#020617]/95 border-b border-white/5 backdrop-blur-2xl overflow-hidden"
          >
            <div className="container mx-auto px-6 py-8 space-y-6">
              <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                 <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                    <User className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="text-sm font-black text-white">{session.user?.name || "Administrator"}</p>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{session.user?.email}</p>
                 </div>
              </div>

              <nav className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all font-bold",
                      link.active 
                        ? "bg-primary/10 text-primary border border-primary/10" 
                        : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="pt-4">
                <Button
                  variant="destructive"
                  className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest"
                  onClick={() => logout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out of Vault
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
