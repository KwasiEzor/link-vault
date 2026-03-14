"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";
import { Monitor, Globe, MapPin } from "lucide-react";

interface AnalyticsBreakdownProps {
  devices: { name: string; value: number }[];
  referrers: { name: string; value: number }[];
  countries: { name: string; value: number }[];
}

const COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#f43f5e"];

export function AnalyticsBreakdown({ devices, referrers, countries }: AnalyticsBreakdownProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-8 mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Device Breakdown (Donut Chart) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-[2.5rem] border-white/5 shadow-2xl p-8 overflow-hidden relative"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Device Breakdown</h3>
              <p className="text-sm text-muted-foreground font-medium">Platform distribution</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Monitor className="h-5 w-5" />
            </div>
          </div>

          <div className="h-[250px] w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={2000}
                  >
                    {devices.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #ffffff10", borderRadius: "12px" }}
                     itemStyle={{ color: "#fff", fontWeight: 700 }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="h-32 w-32 rounded-full border-8 border-white/5 animate-pulse" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Referrers (List) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-[2.5rem] border-white/5 shadow-2xl p-8 overflow-hidden relative"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Traffic Sources</h3>
              <p className="text-sm text-muted-foreground font-medium">Top referrers this week</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Globe className="h-5 w-5" />
            </div>
          </div>

          <div className="space-y-4">
            {referrers.length > 0 ? (
              referrers.map((ref, i) => (
                <div key={ref.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-[10px] group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        {i + 1}
                     </div>
                     <span className="text-sm font-bold text-slate-200 truncate max-w-[150px]">{ref.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${referrers[0]?.value ? (ref.value / referrers[0].value) * 100 : 0}%` 
                        }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full bg-linear-to-r from-primary to-indigo-500"
                      />
                    </div>
                    <span className="text-sm font-black text-white">{ref.value}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground italic text-sm">
                No traffic sources identified yet.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Geographic Breakdown (New Section) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="glass rounded-[2.5rem] border-white/5 shadow-2xl p-8 overflow-hidden relative"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-white">Top Locations</h3>
            <p className="text-sm text-muted-foreground font-medium">Visitor geography by country code</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <MapPin className="h-5 w-5" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {countries.length > 0 ? (
            countries.map((country) => (
              <div key={country.name} className="flex flex-col gap-1 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-black text-white">{country.name}</span>
                  <span className="text-[10px] sm:text-xs font-bold text-primary">{Math.round((country.value / countries.reduce((acc, c) => acc + c.value, 0)) * 100)}%</span>
                </div>
                <div className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {country.value} {country.value === 1 ? 'Visit' : 'Visits'}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground italic text-sm">
              Waiting for geographic data to propagate...
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
