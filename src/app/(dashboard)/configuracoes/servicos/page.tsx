"use client";

import { useState } from "react";
import { useExtraServices } from "@/hooks/useExtraServices";
import { toast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/formatters";
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight, Minus } from "lucide-react";
import type { ExtraService, ExtraServiceType } from "@/domain/entities";

const EMPTY = { name: "", type: "add" as ExtraServiceType, amount: "" };

export default function ServicosPage() {
  const { services, loading, create, update, remove } = useExtraServices(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(form.amount) * 100);
    if (!form.name.trim() || isNaN(cents) || cents < 0) {
      toast({ title: "Preencha nome e valor", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await create({ name: form.name.trim(), type: form.type, defaultAmountInCents: cents });
      setForm(EMPTY);
      toast({ title: "Serviço criado!", variant: "success" });
    } catch {
      toast({ title: "Erro ao criar serviço", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (svc: ExtraService) => {
    try {
      await update(svc.id, { isActive: !svc.isActive });
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este serviço?")) return;
    try {
      await remove(id);
      toast({ title: "Serviço removido", variant: "success" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in max-w-2xl space-y-5">

      {/* ── Formulário de criação ── */}
      <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-50 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
            <Plus className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Novo Serviço / Taxa</h2>
            <p className="text-xs text-muted-foreground">Criados aqui ficam disponíveis em todos os atendimentos</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="p-4 space-y-3">
          {/* Nome */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Nome *</label>
            <input
              type="text"
              placeholder="Ex: Taxa cartão, Remoção de pontas..."
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo</label>
            <div className="flex rounded-xl border border-input overflow-hidden h-11">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: "add" }))}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors ${
                  form.type === "add"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-white text-muted-foreground hover:bg-gray-50"
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Taxa / Acréscimo
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: "deduct" }))}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold border-l transition-colors ${
                  form.type === "deduct"
                    ? "bg-red-100 text-red-700"
                    : "bg-white text-muted-foreground hover:bg-gray-50"
                }`}
              >
                <Minus className="w-3.5 h-3.5" /> Desconto
              </button>
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Valor (R$) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full h-11 pl-8 pr-3 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !form.name.trim() || !form.amount}
            className="w-full h-10 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? "Salvando..." : "Criar Serviço"}
          </button>
        </form>
      </div>

      {/* ── Lista de serviços ── */}
      <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-50 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
            <Tag className="w-4 h-4 text-brand-600" />
          </div>
          <h2 className="font-semibold text-sm">Serviços cadastrados</h2>
          <span className="ml-auto text-xs text-muted-foreground">{services.filter(s => s.isActive).length} ativos</span>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
        ) : services.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum serviço cadastrado ainda.</p>
        ) : (
          <div className="divide-y divide-brand-50">
            {services.map((svc) => (
              <div key={svc.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${!svc.isActive ? "opacity-50" : ""}`}>
                {/* Badge tipo */}
                <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  svc.type === "add" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                }`}>
                  {svc.type === "add" ? "+" : "−"}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{svc.name}</p>
                  <p className={`text-xs font-semibold ${svc.type === "add" ? "text-amber-600" : "text-red-600"}`}>
                    {formatCurrency(svc.defaultAmountInCents)}
                  </p>
                </div>

                {/* Toggle ativo */}
                <button
                  onClick={() => toggleActive(svc)}
                  className="text-muted-foreground hover:text-brand-600 transition-colors flex-shrink-0"
                  title={svc.isActive ? "Desativar" : "Ativar"}
                >
                  {svc.isActive
                    ? <ToggleRight className="w-5 h-5 text-brand-500" />
                    : <ToggleLeft className="w-5 h-5" />
                  }
                </button>

                {/* Remover */}
                <button
                  onClick={() => handleDelete(svc.id)}
                  className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
