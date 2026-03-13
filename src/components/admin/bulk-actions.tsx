"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteLinks } from "@/app/actions/links";
import { toast } from "sonner";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BulkActionsProps {
  selectedIds: string[];
  onClear: () => void;
  onComplete: () => void;
}

export function BulkActions({ selectedIds, onClear, onComplete }: BulkActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} assets?`)) return;

    setLoading(true);
    try {
      await deleteLinks(selectedIds);
      toast.success(`${selectedIds.length} assets deleted successfully`);
      onComplete();
    } catch {
      toast.error("Failed to delete assets");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <div className="glass border-primary/20 bg-primary/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 border overflow-hidden relative">
            <div className="absolute inset-0 bg-primary/5 -z-10" />
            
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm">
                {selectedIds.length}
              </div>
              <p className="text-sm font-bold text-white">Assets Selected</p>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClear}
                className="text-white/60 hover:text-white hover:bg-white/5 h-9 rounded-xl"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDelete}
                disabled={loading}
                className="h-9 rounded-xl bg-red-500 hover:bg-red-600 font-bold shadow-lg shadow-red-500/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loading ? "Deleting..." : "Delete All"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
