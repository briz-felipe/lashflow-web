"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
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
        {/* pb-20 on mobile to clear the bottom nav (h-16) + safe area buffer */}
        <main className="flex-1 overflow-y-auto min-w-0 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </SidebarProvider>
  );
}
