"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ExternalLink, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ShareButton } from "@/components/share-button";

type LinkData = {
  id: string;
  url: string;
  title: string;
  slug: string | null;
  description: string | null;
  image: string | null;
  category: string | null;
};

export function LinkCard({ link }: { link: LinkData }) {
  let hostname = "unknown";
  try {
    hostname = new URL(link.url).hostname.replace("www.", "");
  } catch {
    // If a bad URL makes it into the DB, don't crash the UI.
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -8 }}
      className="group h-full"
    >
      <Card className="bg-[#020617] border border-white/10 rounded-[24px] overflow-hidden flex flex-col h-full transition-all duration-500 hover:border-white/25 hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.4),0_0_20px_-5px_rgba(79,70,229,0.2)] py-0 gap-0">
        <Link 
          href={`/links/${link.slug || link.id}`}
          className="relative aspect-[16/9] w-full overflow-hidden block"
        >
          {link.image ? (
            <Image
              src={link.image}
              alt={link.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-slate-900 gap-2">
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
                <Loader2 className="h-8 w-8 text-primary animate-spin relative" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 animate-pulse">
                Auto-Enriching...
              </span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 shadow-2xl">
              <span className="text-white text-xs font-bold tracking-wide">
                {link.category || "General"}
              </span>
            </div>
          </div>
        </Link>
        
        <CardContent className="relative flex-1 p-8 space-y-4">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
          
          <Link 
            href={`/links/${link.slug || link.id}`}
            className="block"
          >
            <h3 className="font-bold text-2xl tracking-tight text-white line-clamp-2 leading-tight transition-all duration-300 group-hover:text-primary-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {link.title}
            </h3>
          </Link>
          <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 transition-colors duration-300 group-hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            {link.description || "A curated link from your vault."}
          </p>
        </CardContent>

        <CardFooter className="px-8 py-6 border-t border-white/5 flex justify-between items-center bg-black/40 transition-colors duration-500 group-hover:bg-black/60">
          <div className="flex items-center gap-3">
            <div className="relative w-5 h-5 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              <Image 
                src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} 
                width={12}
                height={12}
                alt=""
                className="w-3 h-3"
                unoptimized
              />
            </div>
            <span className="text-[11px] uppercase tracking-[0.15em] text-slate-400 font-bold">
              {hostname}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ShareButton 
              url={link.url}
              title={link.title}
              description={link.description || undefined}
              variant="icon"
            />
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              title="Visit site"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
