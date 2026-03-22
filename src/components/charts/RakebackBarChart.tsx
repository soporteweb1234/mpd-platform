"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface RakebackChartProps {
  data: { month: string; amount: number }[];
}

export function RakebackChart({ data }: RakebackChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#30363D" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "#8B949E", fontSize: 12 }}
          axisLine={{ stroke: "#30363D" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#8B949E", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `€${v}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "8px",
            color: "#E6EDF3",
            fontSize: "13px",
          }}
          formatter={(value) => [`€${Number(value).toFixed(2)}`, "Rakeback"]}
          cursor={{ fill: "rgba(201, 168, 76, 0.05)" }}
        />
        <Bar
          dataKey="amount"
          fill="#C9A84C"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
