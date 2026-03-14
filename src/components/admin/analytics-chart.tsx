"use client";

import { useMemo, useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

interface AnalyticsChartProps {
  data: { date: string; clicks: number }[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const chartData = useMemo(() => data, [data]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass rounded-[2rem] border-white/5 shadow-2xl p-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white">Vault Performance</h3>
          <p className="text-sm text-muted-foreground font-medium">Link visits over the last 7 days</p>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
          Live Analytics
        </div>
      </div>

      <div className="h-[300px] w-full">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#0f172a", 
                  border: "1px solid #ffffff10", 
                  borderRadius: "16px",
                  boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                }}
                itemStyle={{ color: "#6366f1", fontWeight: 800 }}
                labelStyle={{ color: "#f8fafc", marginBottom: "4px", fontWeight: 700 }}
                cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="#6366f1"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorClicks)"
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
             <div className="w-full h-[200px] bg-white/5 animate-pulse rounded-2xl" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
