"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";

interface IncomeVsExpenseChartProps {
  data: { month: string; receita: number; custos: number }[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    const receita = payload.find((p: any) => p.dataKey === "receita")?.value ?? 0;
    const custos = payload.find((p: any) => p.dataKey === "custos")?.value ?? 0;
    const diff = receita - custos;
    return (
      <div className="bg-white border border-brand-100 rounded-xl p-3 shadow-card-hover min-w-[170px]">
        <p className="text-xs text-muted-foreground capitalize mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
              {p.dataKey === "receita" ? "Receita" : "Custos"}
            </span>
            <span className="font-semibold">{formatCurrency(p.value)}</span>
          </div>
        ))}
        <div className="border-t border-brand-50 mt-2 pt-2 flex justify-between text-sm font-bold">
          <span>Saldo</span>
          <span className={diff >= 0 ? "text-emerald-600" : "text-red-500"}>
            {formatCurrency(diff)}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function IncomeVsExpenseChart({ data }: IncomeVsExpenseChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
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
          formatter={(value) => (value === "receita" ? "Receita" : "Custos")}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="receita"
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#incomeGradient)"
          dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
          activeDot={{ r: 5, fill: "#059669" }}
        />
        <Area
          type="monotone"
          dataKey="custos"
          stroke="#f43f5e"
          strokeWidth={2.5}
          fill="url(#expenseGradient)"
          dot={{ fill: "#f43f5e", strokeWidth: 2, r: 3 }}
          activeDot={{ r: 5, fill: "#e11d48" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
