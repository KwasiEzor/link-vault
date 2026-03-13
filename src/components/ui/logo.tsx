import { Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({ 
  className, 
  iconClassName, 
  textClassName,
  showText = true 
}: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-3 group", className)}>
      <div className={cn(
        "h-10 w-10 rounded-xl bg-linear-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-105",
        iconClassName
      )}>
        <Sparkles className="h-6 w-6" />
      </div>
      {showText && (
        <span className={cn("font-bold text-xl tracking-tight", textClassName)}>
          Link<span className="bg-gradient-to-r from-primary via-indigo-400 to-violet-500 bg-clip-text text-transparent font-black">Vault</span>
        </span>
      )}
    </Link>
  );
}
