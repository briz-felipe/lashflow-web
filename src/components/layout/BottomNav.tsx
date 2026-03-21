"use client";

import { Banknote, CalendarDays, LayoutDashboard, MoreHorizontal, Users } from "lucide-react";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";

const tabs = [
  { href: "/dashboard", label: "Início",     icon: LayoutDashboard },
  { href: "/agenda",    label: "Agenda",     icon: CalendarDays },
  { href: "/clientes",  label: "Clientes",   icon: Users },
  { href: "/financeiro",label: "Financeiro", icon: Banknote },
];

export function BottomNav() {
  const pathname = usePathname();
  const { toggle } = useSidebar();

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    /* Wrapper que respeita a safe area e empurra o pill para cima */
    <div
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 15px)" }}
    >
      {/* Pill flutuante */}
      <div className="mx-3 bg-white rounded-2xl shadow-lg border border-brand-100 flex items-stretch overflow-hidden">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 h-16 transition-colors",
                active ? "text-brand-600" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-all", active && "stroke-[2.5px] scale-105")} />
              <span className={cn("text-[10px]", active ? "font-semibold" : "font-medium")}>
                {label}
              </span>
            </Link>
          );
        })}

        <button
          onClick={toggle}
          className="flex-1 flex flex-col items-center justify-center gap-1 h-16 text-muted-foreground transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </div>
    </div>
  );
}
