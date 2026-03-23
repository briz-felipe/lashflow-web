import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: "purple" | "green" | "amber" | "blue" | "red";
  className?: string;
}

const colorMap = {
  purple: {
    bg: "bg-brand-100",
    icon: "text-brand-600",
    badge: "bg-brand-50 text-brand-700",
  },
  green: {
    bg: "bg-emerald-100",
    icon: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700",
  },
  amber: {
    bg: "bg-amber-100",
    icon: "text-amber-600",
    badge: "bg-amber-50 text-amber-700",
  },
  blue: {
    bg: "bg-blue-100",
    icon: "text-blue-600",
    badge: "bg-blue-50 text-blue-700",
  },
  red: {
    bg: "bg-red-100",
    icon: "text-red-600",
    badge: "bg-red-50 text-red-700",
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  color = "purple",
  className,
}: StatsCardProps) {
  const colors = colorMap[color];
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-brand-100 p-4 sm:p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div
          className={cn(
            "w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center",
            colors.bg
          )}
        >
          <span className={cn("w-4 h-4 sm:w-5 sm:h-5", colors.icon)}>{icon}</span>
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
              isPositive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">{title}</p>
        <p className="text-lg sm:text-2xl font-bold text-foreground truncate">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trendLabel && (
          <p className="text-xs text-muted-foreground mt-1">{trendLabel}</p>
        )}
      </div>
    </div>
  );
}
