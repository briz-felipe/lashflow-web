"use client";

import { useState, useMemo } from "react";
import { Minus, Package, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { MATERIAL_CATEGORY_LABELS, MATERIAL_UNIT_LABELS } from "@/domain/enums";
import type { Material } from "@/domain/entities";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: Material[];
  onSubmit: (materialId: string, quantity: number, notes?: string) => Promise<void>;
}

export function RegistrarUsoDialog({ open, onOpenChange, materials, onSubmit }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Material | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return materials;
    const s = search.toLowerCase();
    return materials.filter((m) => m.name.toLowerCase().includes(s));
  }, [materials, search]);

  function reset() {
    setSearch("");
    setSelected(null);
    setQuantity("1");
    setNotes("");
    setSaving(false);
  }

  function handleClose(o: boolean) {
    if (!o) reset();
    onOpenChange(o);
  }

  async function handleSubmit() {
    if (!selected) {
      toast({ title: "Selecione um material", variant: "destructive" });
      return;
    }
    const qty = parseInt(quantity) || 0;
    if (qty <= 0) {
      toast({ title: "Quantidade deve ser maior que 0", variant: "destructive" });
      return;
    }
    if (qty > selected.currentStock) {
      toast({
        title: `Estoque insuficiente (disponivel: ${selected.currentStock})`,
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await onSubmit(selected.id, qty, notes || undefined);
      toast({ title: "Uso registrado!", variant: "success" });
      handleClose(false);
    } catch {
      toast({ title: "Erro ao registrar uso", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-700">
            <Minus className="w-4 h-4" /> Registrar Uso
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Material selection */}
          {!selected ? (
            <div className="space-y-2">
              <Label>Material *</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar material..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-brand-50 p-1">
                {filtered.map((m) => {
                  const isLow = m.minimumStock > 0 && m.currentStock <= m.minimumStock;
                  return (
                    <button
                      key={m.id}
                      onClick={() => { setSelected(m); setSearch(""); }}
                      className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-brand-50 transition-colors"
                    >
                      <Package className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {MATERIAL_CATEGORY_LABELS[m.category]}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${isLow ? "text-red-600" : "text-emerald-600"}`}>
                          {m.currentStock}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{MATERIAL_UNIT_LABELS[m.unit]}</p>
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum material encontrado
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <Label>Material *</Label>
              <div className="flex items-center gap-2 bg-brand-50 rounded-lg px-3 py-2 mt-1.5">
                <Package className="w-4 h-4 text-brand-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selected.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Estoque: {selected.currentStock} {MATERIAL_UNIT_LABELS[selected.unit]}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quantity + Notes (show after selection) */}
          {selected && (
            <>
              <div>
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  min="1"
                  max={selected.currentStock}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Disponivel: {selected.currentStock} {MATERIAL_UNIT_LABELS[selected.unit]}
                </p>
              </div>
              <div>
                <Label>Observacoes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Usado no atendimento da Maria..."
                  className="mt-1.5"
                />
              </div>
              <Button className="w-full h-11" onClick={handleSubmit} disabled={saving}>
                <Minus className="w-4 h-4" />
                {saving ? "Registrando..." : `Registrar Uso de ${parseInt(quantity) || 0} ${MATERIAL_UNIT_LABELS[selected.unit]}`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
