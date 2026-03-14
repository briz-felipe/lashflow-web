"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { appointmentService } from "@/services";
import type { RevenueStats, MonthlyRevenue } from "@/services/interfaces/IPaymentService";
import type { Appointment } from "@/domain/entities";

export interface DashboardStats {
  totalClients: number;
  clientsWithUpcomingAppointments: number;
  todayAppointmentsCount: number;
  revenueStats: RevenueStats | null;
  monthlyRevenue: MonthlyRevenue[];
  todayAppointments: Appointment[];
  pendingApprovals: Appointment[];
  pendingApprovalsCount: number;
  loading: boolean;
}

interface DashboardStatsResponse {
  totalClients: number;
  clientsWithUpcomingAppointments: number;
  todayAppointmentsCount: number;
  revenueStats: RevenueStats;
  monthlyRevenue: MonthlyRevenue[];
  pendingApprovalsCount: number;
}

interface DashboardTodayResponse {
  appointments: Appointment[];
  pendingApprovalsCount: number;
}

export function useDashboard(): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    clientsWithUpcomingAppointments: 0,
    todayAppointmentsCount: 0,
    revenueStats: null,
    monthlyRevenue: [],
    todayAppointments: [],
    pendingApprovals: [],
    pendingApprovalsCount: 0,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [dashStats, dashToday, pendingApprovals] = await Promise.all([
          api.get<DashboardStatsResponse>("/dashboard/stats"),
          api.get<DashboardTodayResponse>("/dashboard/today"),
          appointmentService.getPendingApprovals(),
        ]);

        if (!isMounted) return;

        setStats({
          totalClients: dashStats.totalClients,
          clientsWithUpcomingAppointments: dashStats.clientsWithUpcomingAppointments,
          todayAppointmentsCount: dashStats.todayAppointmentsCount,
          revenueStats: dashStats.revenueStats,
          monthlyRevenue: dashStats.monthlyRevenue,
          todayAppointments: dashToday.appointments,
          pendingApprovals,
          pendingApprovalsCount: dashStats.pendingApprovalsCount,
          loading: false,
        });
      } catch {
        if (isMounted) setStats((s) => ({ ...s, loading: false }));
      }
    }

    load();
    return () => { isMounted = false; };
  }, []);

  return stats;
}
