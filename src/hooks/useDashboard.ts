"use client";

import { useState, useEffect } from "react";
import { paymentService, appointmentService, clientService } from "@/services";
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
  loading: boolean;
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
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [
          clientsResult,
          revenueStats,
          monthlyRevenue,
          todayAppointments,
          pendingApprovals,
          allUpcoming,
        ] = await Promise.all([
          clientService.listClients(),
          paymentService.getRevenueStats(),
          paymentService.getMonthlyRevenue(6),
          appointmentService.getTodayAppointments(),
          appointmentService.getPendingApprovals(),
          appointmentService.listAppointments({
            status: ["confirmed", "pending_approval"],
            from: new Date(),
          }),
        ]);

        if (!isMounted) return;

        const uniqueClientIds = new Set(allUpcoming.map((a) => a.clientId));

        setStats({
          totalClients: clientsResult.total,
          clientsWithUpcomingAppointments: uniqueClientIds.size,
          todayAppointmentsCount: todayAppointments.length,
          revenueStats,
          monthlyRevenue,
          todayAppointments,
          pendingApprovals,
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
