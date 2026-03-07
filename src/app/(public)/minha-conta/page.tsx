"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { clientService, appointmentService } from "@/services";
import { mockProcedures } from "@/data";
import { formatCurrency, formatDateTime, formatPhone } from "@/lib/formatters";
import { User, Calendar, Phone, LogOut } from "lucide-react";
import type { Client } from "@/domain/entities";
import type { Appointment } from "@/domain/entities";
import { toast } from "@/components/ui/toaster";

export default function MinhaContaPage() {
  const [phone, setPhone] = useState("");
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setNotFound(false);
    try {
      const results = await clientService.searchClients(phone.replace(/\D/g, ""));
      if (results.length === 0) {
        setNotFound(true);
        return;
      }
      const found = results[0];
      setClient(found);
      const apts = await appointmentService.listAppointments({ clientId: found.id });
      setAppointments(apts);
    } catch {
      toast({ title: "Erro ao buscar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setClient(null);
    setAppointments([]);
    setPhone("");
  };

  if (!client) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-800 mb-2">Minha Conta</h1>
          <p className="text-muted-foreground">
            Informe seu número de WhatsApp para acessar seus agendamentos
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> WhatsApp
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="mt-1.5"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            {notFound && (
              <p className="text-sm text-red-600">
                Nenhuma conta encontrada com este número.
              </p>
            )}
            <Button className="w-full" onClick={handleLogin} disabled={loading || !phone.trim()}>
              {loading ? "Buscando..." : "Acessar"}
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Ainda não tem agendamento?{" "}
          <a href="/agendar" className="text-brand-600 font-medium hover:underline">
            Agende agora
          </a>
        </p>
      </div>
    );
  }

  const upcoming = appointments.filter((a) => a.status === "confirmed" || a.status === "pending_approval");
  const past = appointments.filter((a) => a.status === "completed" || a.status === "cancelled" || a.status === "no_show");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xl font-bold">
              {client.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{client.name}</h2>
              <p className="text-sm text-muted-foreground">{formatPhone(client.phone)}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-500" />
          Próximos Agendamentos
        </h3>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-8 text-center">
            <Calendar className="w-8 h-8 text-brand-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum agendamento futuro</p>
            <a href="/agendar">
              <Button variant="outline" size="sm" className="mt-3">
                Agendar agora
              </Button>
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt) => {
              const proc = mockProcedures.find((p) => p.id === apt.procedureId);
              return (
                <div key={apt.id} className="bg-white rounded-2xl border border-brand-100 shadow-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{proc?.name ?? "—"}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(apt.scheduledAt)}
                      </p>
                      <p className="text-sm font-semibold text-brand-700 mt-1">
                        {formatCurrency(apt.priceCharged)}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={apt.status} />
                  </div>
                  {apt.status === "pending_approval" && (
                    <p className="text-xs text-amber-600 mt-2">
                      Aguardando confirmação da profissional
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History */}
      {past.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3">Histórico</h3>
          <div className="space-y-2">
            {past.slice(0, 5).map((apt) => {
              const proc = mockProcedures.find((p) => p.id === apt.procedureId);
              return (
                <div key={apt.id} className="bg-white rounded-xl border border-brand-50 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{proc?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(apt.scheduledAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{formatCurrency(apt.priceCharged)}</p>
                    <AppointmentStatusBadge status={apt.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
