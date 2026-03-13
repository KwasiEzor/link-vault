import { Logo } from "@/components/ui/logo";
import { LogIn, LayoutDashboard, LogOut, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { CommandTrigger } from "./command-trigger";

interface NavbarProps {
  variant?: "public" | "admin" | "detail";
}

export async function Navbar({ variant = "public" }: NavbarProps) {
  const session = await auth();

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

        <div className="flex items-center gap-2 sm:gap-4">
          <CommandTrigger />
          
          {variant === "detail" && (
            <div className="hidden lg:block">
              <Logo showText={false} iconClassName="h-8 w-8" />
            </div>
          )}

          {session ? (
            <div className="flex items-center gap-1 sm:gap-3">
              <Link 
                href="/admin" 
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-muted-foreground hover:text-primary transition-colors font-medium px-2 sm:px-3",
                  variant === "admin" && "text-primary bg-primary/5"
                )}
                title="Dashboard"
              >
                <LayoutDashboard className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Dashboard</span>
              </Link>

              <Link 
                href="/admin/curation" 
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-muted-foreground hover:text-violet-400 transition-colors font-medium px-2 sm:px-3"
                )}
                title="Curator's Lab"
              >
                <Sparkles className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Curator's Lab</span>
              </Link>
              
              <div className="h-4 w-px bg-white/10 hidden sm:block mx-1" />
              
              <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  type="submit" 
                  className="text-muted-foreground hover:text-destructive transition-colors font-medium px-2 sm:px-3"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </form>
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
      </div>
    </header>
  );
}
