"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyRevenue } from "@/services/interfaces/IPaymentService";
import { formatCurrency } from "@/lib/formatters";

interface RevenueChartProps {
  data: MonthlyRevenue[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-brand-100 rounded-xl p-3 shadow-card-hover">
        <p className="text-xs text-muted-foreground capitalize">{label}</p>
        <p className="text-sm font-bold text-brand-700">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((d) => ({
    month: d.month,
    value: d.amountInCents,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
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
        <Area
          type="monotone"
          dataKey="value"
          stroke="#a855f7"
          strokeWidth={2.5}
          fill="url(#revenueGradient)"
          dot={{ fill: "#a855f7", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "#7c3aed" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
