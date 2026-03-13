"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
    }
  }, []);

  const acceptConsent = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-2xl"
        >
          <div className="bg-background/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center gap-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Cookie className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-white font-bold tracking-tight mb-1">Cookie Preferences</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We use essential cookies to ensure LinkVault works correctly. 
                By continuing, you agree to our{" "}
                <Link href="/cookies" className="text-primary hover:underline font-medium">
                  Cookie Policy
                </Link>.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button 
                onClick={acceptConsent}
                className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
              >
                Accept All
              </Button>
              <button 
                onClick={() => setIsVisible(false)}
                className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
