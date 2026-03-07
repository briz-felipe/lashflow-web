"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { mockTimeSlots, mockBlockedDates } from "@/data";
import { Settings, Clock, Link2, Copy, Check } from "lucide-react";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function ConfiguracoesPage() {
  const [copied, setCopied] = useState(false);
  const publicLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/agendar`
      : "/agendar";

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copiado!", variant: "success" });
  };

  return (
    <div>
      <Topbar title="Configurações" />

      <div className="p-6 animate-fade-in space-y-6 max-w-3xl">
        <PageHeader
          title="Configurações"
          description="Gerencie sua agenda e link público de agendamento"
        />

        {/* Public link */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-brand-700">
            <Link2 className="w-4 h-4" />
            Link Público de Agendamento
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Compartilhe este link com suas clientes para que elas possam solicitar horários
            diretamente.
          </p>
          <div className="flex gap-3">
            <Input value={publicLink} readOnly className="flex-1 bg-brand-50 border-brand-200" />
            <Button variant="outline" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>
        </div>

        {/* Working hours */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-brand-700">
            <Clock className="w-4 h-4" />
            Horários de Atendimento
          </h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const slot = mockTimeSlots.find((s) => s.dayOfWeek === day);
              return (
                <div
                  key={day}
                  className="flex items-center gap-4 p-3 rounded-xl border border-brand-50 hover:border-brand-200 transition-colors"
                >
                  <span className="w-8 text-sm font-semibold text-center">
                    {DAY_NAMES[day]}
                  </span>
                  {slot ? (
                    <>
                      <Badge variant="success">Disponível</Badge>
                      <span className="text-sm text-muted-foreground">
                        {slot.startTime} — {slot.endTime}
                      </span>
                    </>
                  ) : (
                    <Badge variant="muted">Fechado</Badge>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Os horários são configurados automaticamente com base nos slots cadastrados.
            A edição de horários estará disponível na versão com backend.
          </p>
        </div>

        {/* Blocked dates */}
        <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-brand-700">
            <Settings className="w-4 h-4" />
            Datas Bloqueadas
          </h2>
          {mockBlockedDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma data bloqueada</p>
          ) : (
            <div className="space-y-2">
              {mockBlockedDates.map((bd) => (
                <div
                  key={bd.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-red-50 bg-red-50/50"
                >
                  <div>
                    <p className="text-sm font-medium">{bd.date}</p>
                    {bd.reason && <p className="text-xs text-muted-foreground">{bd.reason}</p>}
                  </div>
                  <Badge variant="destructive">Bloqueado</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
