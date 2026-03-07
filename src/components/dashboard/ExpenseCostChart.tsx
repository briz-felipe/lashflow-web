"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";

interface ExpenseCostChartProps {
  data: { month: string; despesas: number; materiais: number }[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    const total = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
    return (
      <div className="bg-white border border-brand-100 rounded-xl p-3 shadow-card-hover min-w-[160px]">
        <p className="text-xs text-muted-foreground capitalize mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
              {p.dataKey === "despesas" ? "Despesas" : "Materiais"}
            </span>
            <span className="font-semibold">{formatCurrency(p.value)}</span>
          </div>
        ))}
        <div className="border-t border-brand-50 mt-2 pt-2 flex justify-between text-sm font-bold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    );
  }
  return null;
}

export function ExpenseCostChart({ data }: ExpenseCostChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#a3a3a3" }}
          axisLine={false}
          tickLine={false}
          style={{ textTransform: "capitalize" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#a3a3a3" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${(v / 100).toFixed(0)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (value === "despesas" ? "Despesas" : "Materiais")}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="despesas" stackId="costs" fill="#f43f5e" radius={[0, 0, 0, 0]} />
        <Bar dataKey="materiais" stackId="costs" fill="#a855f7" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
