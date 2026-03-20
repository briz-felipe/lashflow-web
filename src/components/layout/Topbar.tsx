"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePendingApprovals } from "@/hooks/useAppointments";
import Link from "next/link";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { appointments: pending } = usePendingApprovals();

  return (
    <header className="h-14 sm:h-16 border-b border-brand-100 bg-white/80 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href="/agenda">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {pending.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white font-bold">
                {pending.length > 9 ? "9+" : pending.length}
              </span>
            )}
          </Button>
        </Link>
      </div>
    </header>
  );
}
