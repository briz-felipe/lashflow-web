"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useProcedures } from "@/hooks/useProcedures";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { formatCurrency } from "@/lib/formatters";
import {
  Plus,
  Sparkles,
  Clock,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "@/components/ui/toaster";
import type { Procedure } from "@/domain/entities";

export default function ProcedimentosPage() {
  const { procedures, loading, createProcedure, updateProcedure, deleteProcedure, toggleActive } = useProcedures();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [saving, setSaving] = useState(false);

  const defaultForm = { name: "", description: "", priceInCents: "", durationHours: "0", durationMins: "30" };
  const [form, setForm] = useState(defaultForm);

  const openCreate = () => { setEditing(null); setForm(defaultForm); setShowForm(true); };
  const openEdit = (p: Procedure) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      priceInCents: String(p.priceInCents / 100),
      durationHours: String(Math.floor(p.durationMinutes / 60)),
      durationMins: String(p.durationMinutes % 60),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const totalMinutes = parseInt(form.durationHours || "0") * 60 + parseInt(form.durationMins || "0");
    if (!form.name || !form.priceInCents || totalMinutes <= 0) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const input = {
        name: form.name,
        description: form.description || undefined,
        priceInCents: Math.round(parseFloat(form.priceInCents.replace(",", ".")) * 100),
        durationMinutes: totalMinutes,
        isActive: true,
      };
      if (editing) {
        await updateProcedure(editing.id, input);
        toast({ title: "Procedimento atualizado!", variant: "success" });
      } else {
        await createProcedure(input);
        toast({ title: "Procedimento criado!", variant: "success" });
      }
      setShowForm(false);
    } catch (err) {
      console.error("[procedimentos] handleSave:", err);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPage />;

  const active = procedures.filter((p) => p.isActive);
  const inactive = procedures.filter((p) => !p.isActive);

  return (
    <div>
      <Topbar title="Procedimentos" />

      <div className="p-4 sm:p-6 animate-fade-in">
        <PageHeader
          title="Procedimentos & Técnicas"
          description="Gerencie os procedimentos e suas precificações"
          action={
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Novo Procedimento
            </Button>
          }
        />

        {procedures.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-6 h-6" />}
            title="Nenhum procedimento cadastrado"
            description="Cadastre as técnicas que você oferece"
            action={<Button onClick={openCreate}><Plus className="w-4 h-4" /> Novo Procedimento</Button>}
          />
        ) : (
          <div className="space-y-6">
            {/* Active */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Ativos ({active.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {active.map((proc) => (
                  <ProcedureCard
                    key={proc.id}
                    procedure={proc}
                    onEdit={() => openEdit(proc)}
                    onToggle={async () => { await toggleActive(proc.id); toast({ title: "Status alterado", variant: "success" }); }}
                    onDelete={async () => { await deleteProcedure(proc.id); toast({ title: "Procedimento removido" }); }}
                  />
                ))}
              </div>
            </div>

            {inactive.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Inativos ({inactive.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 opacity-60">
                  {inactive.map((proc) => (
                    <ProcedureCard
                      key={proc.id}
                      procedure={proc}
                      onEdit={() => openEdit(proc)}
                      onToggle={async () => { await toggleActive(proc.id); toast({ title: "Status alterado", variant: "success" }); }}
                      onDelete={async () => { await deleteProcedure(proc.id); toast({ title: "Procedimento removido" }); }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Procedimento" : "Novo Procedimento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Volume Russo 3D" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$) *</Label>
                <Input value={form.priceInCents} onChange={(e) => setForm((f) => ({ ...f, priceInCents: e.target.value }))} placeholder="180,00" className="mt-1.5" />
              </div>
              <div>
                <Label>Duração *</Label>
                <div className="flex gap-2 mt-1.5">
                  <div className="relative flex-1">
                    <Input
                      type="number" min="0" max="23"
                      value={form.durationHours}
                      onChange={(e) => setForm((f) => ({ ...f, durationHours: e.target.value }))}
                      placeholder="0"
                      className="pr-7"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">h</span>
                  </div>
                  <div className="relative flex-1">
                    <Input
                      type="number" min="0" max="59"
                      value={form.durationMins}
                      onChange={(e) => setForm((f) => ({ ...f, durationMins: e.target.value }))}
                      placeholder="30"
                      className="pr-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">min</span>
                  </div>
                </div>
                {(() => {
                  const total = parseInt(form.durationHours || "0") * 60 + parseInt(form.durationMins || "0");
                  return total > 0 ? (
                    <p className="text-xs text-muted-foreground mt-1">= {total} minutos no total</p>
                  ) : null;
                })()}
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descreva o procedimento..." rows={2} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function ProcedureCard({
  procedure,
  onEdit,
  onToggle,
  onDelete,
}: {
  procedure: Procedure;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-100 shadow-card hover:shadow-card-hover transition-shadow p-5 group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-brand-600" />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
            {procedure.isActive ? <ToggleRight className="w-3.5 h-3.5 text-emerald-500" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <h3 className="font-semibold text-foreground">{procedure.name}</h3>
      {procedure.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{procedure.description}</p>
      )}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDuration(procedure.durationMinutes)}</span>
        </div>
        <span className="text-base font-bold text-brand-700">
          {formatCurrency(procedure.priceInCents)}
        </span>
      </div>
    </div>
  );
}
