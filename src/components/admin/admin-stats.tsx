import { Card, CardContent } from "@/components/ui/card";
import { Link2, Layers, TrendingUp } from "lucide-react";

interface AdminStatsProps {
  totalLinks: number;
  totalCategories: number;
  recentLinksCount: number;
}

export function AdminStats({ totalLinks, totalCategories, recentLinksCount }: AdminStatsProps) {
  const stats = [
    {
      label: "Total Assets",
      value: totalLinks,
      icon: Link2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Vault Categories",
      value: totalCategories,
      icon: Layers,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      label: "Recently Added",
      value: recentLinksCount,
      sublabel: "Last 7 days",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
      {stats.map((stat, i) => (
        <Card key={i} className="glass border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group overflow-hidden relative">
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 -mr-8 -mt-8 ${stat.bg}`} />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-white tracking-tight">{stat.value}</h3>
                  {stat.sublabel && (
                    <span className="text-[10px] text-muted-foreground font-medium">{stat.sublabel}</span>
                  )}
                </div>
              </div>
              <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
