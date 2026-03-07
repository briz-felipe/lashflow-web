"use client";

import { useState, useEffect, useCallback } from "react";
import { appointmentService } from "@/services";
import type { Appointment, CreateAppointmentInput } from "@/domain/entities";
import type { AppointmentStatus } from "@/domain/enums";
import type { AppointmentFilters } from "@/services/interfaces/IAppointmentService";

export function useAppointments(filters?: AppointmentFilters) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    try {
      const result = await appointmentService.listAppointments(filters);
      if (isMounted) setAppointments(result);
    } catch {
      if (isMounted) setError("Erro ao carregar agendamentos");
    } finally {
      if (isMounted) setLoading(false);
    }
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    load();
  }, [load]);

  const createAppointment = useCallback(
    async (input: CreateAppointmentInput): Promise<Appointment> => {
      const apt = await appointmentService.createAppointment(input);
      await load();
      return apt;
    },
    [load]
  );

  const updateStatus = useCallback(
    async (id: string, status: AppointmentStatus, reason?: string): Promise<Appointment> => {
      const apt = await appointmentService.updateAppointmentStatus(id, status, reason);
      await load();
      return apt;
    },
    [load]
  );

  const cancelAppointment = useCallback(
    async (id: string, reason?: string, cancelledBy?: "professional" | "client"): Promise<Appointment> => {
      const apt = await appointmentService.cancelAppointment(id, reason, cancelledBy);
      await load();
      return apt;
    },
    [load]
  );

  return { appointments, loading, error, reload: load, createAppointment, updateStatus, cancelAppointment };
}

export function useTodayAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    appointmentService
      .getTodayAppointments()
      .then((apts) => { if (isMounted) setAppointments(apts); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  return { appointments, loading };
}

export function usePendingApprovals() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let isMounted = true;
    const result = await appointmentService.getPendingApprovals();
    if (isMounted) {
      setAppointments(result);
      setLoading(false);
    }
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = useCallback(
    async (id: string) => {
      await appointmentService.updateAppointmentStatus(id, "confirmed");
      await load();
    },
    [load]
  );

  const reject = useCallback(
    async (id: string, reason?: string) => {
      await appointmentService.cancelAppointment(id, reason, "professional");
      await load();
    },
    [load]
  );

  return { appointments, loading, approve, reject, reload: load };
}
