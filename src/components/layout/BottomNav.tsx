"use client";

import { LayoutDashboard, CalendarDays, Users, Banknote, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-brand-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 h-14 transition-colors",
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

        {/* More → opens sidebar drawer with all items */}
        <button
          onClick={toggle}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 h-14 text-muted-foreground transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </div>
    </nav>
  );
}
