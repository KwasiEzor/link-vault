import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LinkCardSkeleton() {
  return (
    <Card className="bg-[#020617] border border-white/10 rounded-[24px] overflow-hidden flex flex-col h-full py-0 gap-0">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      
      <CardContent className="relative flex-1 p-8 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>

      <CardFooter className="px-8 py-6 border-t border-white/5 flex justify-between items-center bg-black/40">
        <div className="flex items-center gap-3">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-5" />
        </div>
      </CardFooter>
    </Card>
  );
}
