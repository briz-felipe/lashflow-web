"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Clock, MessageSquare, Users, User, Plug } from "lucide-react";

const SETTINGS_TABS = [
  { href: "/configuracoes/horarios",    label: "Horários",    icon: Clock },
  { href: "/configuracoes/mensagens",   label: "Mensagens",   icon: MessageSquare },
  { href: "/configuracoes/clientes",    label: "Clientes",    icon: Users },
  { href: "/configuracoes/perfil",      label: "Perfil",      icon: User },
  { href: "/configuracoes/integracoes", label: "Integrações", icon: Plug },
];

export function SettingsSubNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-14 sm:top-16 z-10 bg-white border-b border-brand-100">
      <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2 sm:px-6">
        {SETTINGS_TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0",
                active
                  ? "border-brand-500 text-brand-700"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-brand-200"
              )}
            >
              <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
