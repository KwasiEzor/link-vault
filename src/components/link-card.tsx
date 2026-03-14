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
      whileHover={{ y: -12 }}
      className="group h-full"
    >
      <Card className="bg-[#020617]/40 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden flex flex-col h-full transition-all duration-700 hover:border-primary/40 hover:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.3),0_0_30px_-10px_rgba(79,70,229,0.2)] py-0 gap-0">
        <Link 
          href={`/links/${link.slug || link.id}`}
          className="relative aspect-[16/10] w-full overflow-hidden block"
        >
          {link.image ? (
            <Image
              src={link.image}
              alt={link.title}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-slate-950/40 gap-4">
              <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full animate-pulse" />
                <Loader2 className="h-10 w-10 text-primary animate-spin relative" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">
                Analyzing Resource
              </span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
          
          <div className="absolute top-5 left-5 z-10">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-4 py-1.5 shadow-2xl">
              <span className="text-white text-[10px] font-black uppercase tracking-[0.15em]">
                {link.category || "General"}
              </span>
            </div>
          </div>
        </Link>
        
        <CardContent className="relative flex-1 p-8 pt-6 space-y-4">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
          
          <Link 
            href={`/links/${link.slug || link.id}`}
            className="block"
          >
            <h3 className="font-black text-2xl tracking-tight text-white line-clamp-2 leading-[1.15] transition-all duration-500 group-hover:text-primary drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
              {link.title}
            </h3>
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 transition-colors duration-500 group-hover:text-slate-300">
            {link.description || "A curated link from your personal vault, enriched with AI insights and snapshots."}
          </p>
        </CardContent>

        <CardFooter className="px-8 py-6 border-t border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-sm transition-colors duration-700 group-hover:bg-black/40">
          <div className="flex items-center gap-3">
            <div className="relative w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
              <Image 
                src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=48`} 
                width={16}
                height={16}
                alt=""
                className="opacity-80"
                unoptimized
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-400 transition-colors">
              {hostname}
            </span>
          </div>
          <div className="flex items-center gap-5">
            <div className="opacity-60 hover:opacity-100 transition-opacity">
              <ShareButton 
                url={link.url}
                title={link.title}
                description={link.description || undefined}
                variant="icon"
              />
            </div>
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-white transition-all transform hover:scale-110"
              title="Visit site"
            >
              <ExternalLink className="h-4.5 w-4.5" />
            </a>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
