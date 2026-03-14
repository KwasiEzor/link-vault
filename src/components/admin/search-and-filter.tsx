"use client";

import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface SearchAndFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  categories: string[];
}

export function SearchAndFilter({ 
  search, 
  onSearchChange, 
  category, 
  onCategoryChange, 
  categories 
}: SearchAndFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1 group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="h-4 w-4" />
        </div>
        <Input
          placeholder="Search assets by title, URL, or description..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11 bg-white/5 border-white/5 focus:bg-white/10 focus:ring-primary/20 transition-all rounded-xl placeholder:text-muted-foreground/40"
        />
        {search && (
          <button 
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="outline" className="h-11 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 font-bold group">
            <Filter className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
            {category === "all" ? "All Categories" : category}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass border-white/10 min-w-[200px]">
          <DropdownMenuItem onClick={() => onCategoryChange("all")} className="font-semibold cursor-pointer">
            All Categories
          </DropdownMenuItem>
          {categories.map((cat) => (
            <DropdownMenuItem key={cat} onClick={() => onCategoryChange(cat)} className="font-semibold cursor-pointer">
              {cat}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
