"use client";

import {
  Banknote,
  CalendarDays,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Scissors,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/dashboard",     label: "Dashboard",    icon: LayoutDashboard },
  { href: "/clientes",      label: "Clientes",     icon: Users },
  { href: "/agenda",        label: "Agenda",       icon: CalendarDays },
  { href: "/procedimentos", label: "Procedimentos",icon: Sparkles },
  { href: "/estoque",       label: "Estoque",      icon: Package },
  { href: "/despesas",      label: "Despesas",     icon: Receipt },
  { href: "/financeiro",    label: "Financeiro",   icon: Banknote },
  { href: "/configuracoes", label: "Configurações",icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          // Mobile: fixed overlay drawer
          "fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-gradient-sidebar text-white",
          "transition-transform duration-300 ease-in-out",
          // Desktop: relative, always visible
          "lg:relative lg:translate-x-0 lg:w-64 lg:z-auto lg:flex-shrink-0",
          // Mobile open/close
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex-shrink-0">
              <Scissors className="w-5 h-5 text-brand-200" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">LashFlow</h1>
              <p className="text-xs text-brand-300">Lash Design Studio</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={close}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-brand-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  active
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-brand-200 hover:text-white hover:bg-white/10"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                    active ? "text-white" : "text-brand-300 group-hover:text-white"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 text-white text-xs font-bold flex-shrink-0 uppercase">
              {user?.username?.charAt(0) ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.username ?? "—"}
              </p>
              <p className="text-xs text-brand-300 truncate">
                {user?.isSuperuser ? "Admin" : "Profissional"}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-brand-300 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
