"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Uncaught Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full glass border-white/10 rounded-[2.5rem] p-12 text-center space-y-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/20 rounded-full blur-3xl -z-10" />
        
        <div className="h-20 w-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
          <AlertCircle className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-white">System Error</h1>
          <p className="text-muted-foreground font-medium leading-relaxed">
            An unexpected glitch occurred in the vault. Our curators have been notified.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-left">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Technical Digest</p>
            <p className="text-xs font-mono text-muted-foreground break-all line-clamp-3">
              {error.message || "Unknown error"}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()} 
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Attempt Recovery
          </Button>
          
          <Link href="/" className="w-full">
            <Button variant="ghost" className="w-full h-12 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 font-bold">
              <Home className="mr-2 h-4 w-4" />
              Return to Vault
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
