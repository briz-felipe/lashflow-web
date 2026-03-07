"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-brand-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
