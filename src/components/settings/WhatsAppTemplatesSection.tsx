"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { useWhatsAppTemplates } from "@/hooks/useWhatsAppTemplates";
import type { WhatsAppTemplate } from "@/domain/entities";
import { TEMPLATE_VARIABLE_LABELS } from "@/domain/entities";
import { MessageCircle, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const EMPTY_FORM = { name: "", description: "", message: "" };

function TemplateForm({
  initial,
  saving,
  onSubmit,
  onCancel,
}: {
  initial: typeof EMPTY_FORM;
  saving: boolean;
  onSubmit: (v: typeof EMPTY_FORM) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [varsOpen, setVarsOpen] = useState(false);

  const insertVar = (placeholder: string) => {
    const key = placeholder.split(" ")[0]; // "{{clientName}}"
    setForm((f) => ({ ...f, message: f.message + key }));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="tpl-name">Nome *</Label>
        <Input
          id="tpl-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ex: Confirmação de Agendamento"
          className="mt-1.5"
          autoFocus
        />
      </div>
      <div>
        <Label htmlFor="tpl-desc">Descrição</Label>
        <Input
          id="tpl-desc"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Quando usar este template..."
          className="mt-1.5"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="tpl-msg">Mensagem *</Label>
          <button
            type="button"
            onClick={() => setVarsOpen((o) => !o)}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition-colors"
          >
            Variáveis disponíveis
            {varsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        {varsOpen && (
          <div className="mb-2 p-3 bg-brand-50 rounded-xl border border-brand-100 flex flex-wrap gap-2">
            {Object.entries(TEMPLATE_VARIABLE_LABELS).map(([, label]) => {
              const placeholder = label.split(" ")[0];
              return (
                <button
                  key={placeholder}
                  type="button"
                  onClick={() => insertVar(label)}
                  className="text-xs px-2 py-1 rounded-lg bg-white border border-brand-200 text-brand-700 hover:bg-brand-100 transition-colors font-mono"
                >
                  {placeholder}
                </button>
              );
            })}
          </div>
        )}
        <Textarea
          id="tpl-msg"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder={"Olá {{clientName}}! 😊\n\nSeu agendamento está confirmado:\n📅 *{{date}}* às *{{time}}*\n✨ {{procedure}}"}
          className="font-mono text-sm"
          rows={7}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use as variáveis acima para personalizar a mensagem automaticamente.
        </p>
      </div>
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={saving || !form.name.trim() || !form.message.trim()}
          onClick={() => onSubmit(form)}
        >
          {saving ? "Salvando..." : "Salvar template"}
        </Button>
      </div>
    </div>
  );
}

export function WhatsAppTemplatesSection() {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useWhatsAppTemplates();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WhatsAppTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (t: WhatsAppTemplate) => { setEditing(t); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    try {
      if (editing) {
        await updateTemplate(editing.id, form);
        toast({ title: "Template atualizado!", variant: "success" });
      } else {
        await createTemplate(form);
        toast({ title: "Template criado!", variant: "success" });
      }
      closeModal();
    } catch {
      toast({ title: "Erro ao salvar template", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id);
      toast({ title: "Template removido", variant: "success" });
    } catch {
      toast({ title: "Erro ao remover template", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold flex items-center gap-2 text-brand-700">
            <MessageCircle className="w-4 h-4" />
            Templates de WhatsApp
          </h2>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Novo template
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Crie mensagens personalizadas com variáveis como nome da cliente, data e horário. Use-as diretamente nos agendamentos.
        </p>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-brand-200 rounded-xl">
            Nenhum template criado. Crie o primeiro para agilizar seus lembretes.
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => {
              const isExpanded = expanded === t.id;
              return (
                <div key={t.id} className="rounded-xl border border-brand-100 overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{t.name}</p>
                      {t.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{t.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : t.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-brand-50 transition-colors"
                        title="Ver mensagem"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-brand-50 pt-3">
                      <p className="text-xs font-mono whitespace-pre-wrap text-muted-foreground bg-brand-50 rounded-lg p-3">
                        {t.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Slug: <span className="font-mono text-brand-600">{t.slug}</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) closeModal(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-brand-500" />
              {editing ? "Editar Template" : "Novo Template"}
            </DialogTitle>
          </DialogHeader>
          <TemplateForm
            initial={editing ? { name: editing.name, description: editing.description, message: editing.message } : EMPTY_FORM}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
