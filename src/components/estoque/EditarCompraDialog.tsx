"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, ShoppingCart } from "lucide-react";
import { addMonths, format } from "date-fns";
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
import { formatCurrency, parsePtBR } from "@/lib/formatters";
import { expenseService } from "@/services";
import type { Expense } from "@/domain/entities";

// ── Types ──────────────────────────────────────────────────────────────────────

interface LinkedItem {
  materialName: string;
  quantity: number;
  totalCostInCents: number;
}

interface PurchaseEditTarget {
  id: string;
  name: string;
  linkedMaterials: LinkedItem[];
  installments: { expense: Expense }[];
  totalAmountInCents: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: PurchaseEditTarget | null;
  onComplete: () => Promise<void>;
}

// ── Notes parsing ──────────────────────────────────────────────────────────────

interface ParsedNotes {
  userNotes: string;
  freightInCents: number;
  discountInCents: number;
  surchargeInCents: number;
}

/**
 * Parses notes in the format used by NovaCompraDialog:
 *   "<user notes> | Frete: R$ 25,00 · Acréscimo/juros: R$ 10,00 · Desconto: -R$ 5,00"
 * Also handles partial combinations and notes without extras.
 */
function parseNotes(notes: string | undefined): ParsedNotes {
  const defaults: ParsedNotes = {
    userNotes: "",
    freightInCents: 0,
    discountInCents: 0,
    surchargeInCents: 0,
  };
  if (!notes) return defaults;

  // Detect the extras segment (after last " | " if present, else search whole string)
  const pipeIdx = notes.lastIndexOf(" | ");
  const userPart = pipeIdx >= 0 ? notes.slice(0, pipeIdx) : notes;
  const extrasPart = pipeIdx >= 0 ? notes.slice(pipeIdx + 3) : notes;

  const freightMatch = extrasPart.match(/Frete:\s*R\$\s*([\d.,]+)/i);
  const surchargeMatch = extrasPart.match(/Acréscimo\/juros:\s*R\$\s*([\d.,]+)/i);
  const discountMatch = extrasPart.match(/Desconto:\s*-?R\$\s*([\d.,]+)/i);

  // If no extras found at all, treat whole string as user notes
  const hasAnyExtra = !!(freightMatch || surchargeMatch || discountMatch);
  const userNotes = (hasAnyExtra && pipeIdx >= 0 ? userPart : (hasAnyExtra ? "" : notes)).trim();

  return {
    userNotes,
    freightInCents: freightMatch ? parsePtBR(freightMatch[1]) : 0,
    surchargeInCents: surchargeMatch ? parsePtBR(surchargeMatch[1]) : 0,
    discountInCents: discountMatch ? parsePtBR(discountMatch[1]) : 0,
  };
}

function buildNotes(opts: {
  userNotes: string;
  freightInCents: number;
  surchargeInCents: number;
  discountInCents: number;
}): string | undefined {
  const extras: string[] = [];
  if (opts.freightInCents > 0) extras.push(`Frete: ${formatCurrency(opts.freightInCents)}`);
  if (opts.surchargeInCents > 0) extras.push(`Acréscimo/juros: ${formatCurrency(opts.surchargeInCents)}`);
  if (opts.discountInCents > 0) extras.push(`Desconto: -${formatCurrency(opts.discountInCents)}`);
  const combined = [opts.userNotes.trim(), extras.join(" · ")].filter(Boolean).join(" | ");
  return combined || undefined;
}

function centsToStr(cents: number): string {
  if (cents <= 0) return "";
  return (cents / 100).toFixed(2);
}

// ── Component ──────────────────────────────────────────────────────────────────

export function EditarCompraDialog({ open, onOpenChange, purchase, onComplete }: Props) {
  const [name, setName] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [freight, setFreight] = useState("");
  const [discount, setDiscount] = useState("");
  const [surcharge, setSurcharge] = useState("");
  const [firstPaymentDate, setFirstPaymentDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Installments sorted by installmentCurrent (fallback to array order)
  const sortedInstallments = useMemo(() => {
    if (!purchase) return [];
    return [...purchase.installments].sort((a, b) => {
      const ac = a.expense.installmentCurrent ?? 0;
      const bc = b.expense.installmentCurrent ?? 0;
      return ac - bc;
    });
  }, [purchase]);

  // Populate on open
  useEffect(() => {
    if (!open || !purchase) return;
    const first = sortedInstallments[0]?.expense;
    const parsed = parseNotes(first?.notes);
    setName(purchase.name);
    setUserNotes(parsed.userNotes);
    setFreight(centsToStr(parsed.freightInCents));
    setDiscount(centsToStr(parsed.discountInCents));
    setSurcharge(centsToStr(parsed.surchargeInCents));
    // Current first-installment date = referenceMonth-01 adjusted to dueDay
    if (first) {
      const [y, m] = first.referenceMonth.split("-");
      const day = String(first.dueDay ?? 1).padStart(2, "0");
      setFirstPaymentDate(`${y}-${m}-${day}`);
    } else {
      setFirstPaymentDate("");
    }
  }, [open, purchase, sortedInstallments]);

  const subtotalInCents = useMemo(() => {
    if (!purchase) return 0;
    return purchase.linkedMaterials.reduce((s, i) => s + i.totalCostInCents, 0);
  }, [purchase]);

  const freightInCents = Math.round((parseFloat(freight) || 0) * 100);
  const discountInCents = Math.round((parseFloat(discount) || 0) * 100);
  const surchargeInCents = Math.round((parseFloat(surcharge) || 0) * 100);
  const finalTotal = Math.max(
    0,
    subtotalInCents + freightInCents + surchargeInCents - discountInCents,
  );

  const installmentCount = purchase?.installments.length ?? 1;
  const newInstallmentAmount = Math.round(finalTotal / installmentCount);

  const paidCount = purchase?.installments.filter((i) => i.expense.isPaid).length ?? 0;

  async function handleSave() {
    if (!purchase) return;
    if (!name.trim()) {
      toast({ title: "Nome da compra é obrigatório", variant: "destructive" });
      return;
    }
    if (!firstPaymentDate) {
      toast({ title: "Data da primeira parcela é obrigatória", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const newNotes = buildNotes({
        userNotes,
        freightInCents,
        surchargeInCents,
        discountInCents,
      });
      // Parse first-installment date as noon local to avoid TZ rollover
      const firstDate = new Date(firstPaymentDate + "T12:00:00");
      const newDueDay = firstDate.getDate();
      // Update each installment in order — Nth installment = firstDate + (N-1) months,
      // keeping the same dueDay throughout the series.
      for (let i = 0; i < sortedInstallments.length; i++) {
        const inst = sortedInstallments[i].expense;
        const shifted = addMonths(firstDate, i);
        const newReferenceMonth = format(shifted, "yyyy-MM");
        await expenseService.updateExpense(inst.id, {
          name: name.trim(),
          amountInCents: newInstallmentAmount,
          notes: newNotes,
          dueDay: newDueDay,
          referenceMonth: newReferenceMonth,
        });
      }
      await onComplete();
      toast({ title: "Compra atualizada", variant: "success" });
      onOpenChange(false);
    } catch (err) {
      console.error("[EditarCompra] save error:", err);
      toast({ title: "Erro ao atualizar compra", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (!purchase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-700">
            <Pencil className="w-4 h-4" /> Editar compra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Items summary (read-only on phase 1) */}
          <div className="bg-brand-50/50 rounded-xl p-3 border border-brand-100 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Itens ({purchase.linkedMaterials.length})
            </p>
            {purchase.linkedMaterials.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="w-5 h-5 rounded bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600 flex-shrink-0">
                    {item.quantity}
                  </span>
                  <span className="truncate">{item.materialName}</span>
                </span>
                <span className="text-muted-foreground flex-shrink-0 ml-2">
                  {formatCurrency(item.totalCostInCents)}
                </span>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground italic pt-1 border-t border-brand-100">
              Edição de itens em breve. Por ora ajuste frete/descontos abaixo.
            </p>
          </div>

          {/* Name */}
          <div>
            <Label>Nome da compra *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {/* First payment date — shifts entire installment series */}
          <div>
            <Label>
              {installmentCount > 1 ? "Data da primeira parcela" : "Data do pagamento"}
            </Label>
            <Input
              type="date"
              value={firstPaymentDate}
              onChange={(e) => setFirstPaymentDate(e.target.value)}
              className="mt-1.5"
            />
            {installmentCount > 1 && firstPaymentDate && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Demais parcelas seguem a primeira em +1 mês cada.
                {(() => {
                  const first = new Date(firstPaymentDate + "T12:00:00");
                  const last = addMonths(first, installmentCount - 1);
                  return (
                    <>
                      {" "}Última: {format(last, "dd/MM/yyyy")}.
                    </>
                  );
                })()}
              </p>
            )}
          </div>

          {/* Extras */}
          <div className="bg-brand-50/30 rounded-xl p-3 border border-brand-100 space-y-2.5">
            <p className="text-xs font-semibold text-brand-700">Ajustes do pagamento</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Frete (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={freight}
                  onChange={(e) => setFreight(e.target.value)}
                  placeholder="0,00"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Desconto (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0,00"
                  className="mt-1 h-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Acréscimo / juros (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={surcharge}
                onChange={(e) => setSurcharge(e.target.value)}
                placeholder="0,00"
                className="mt-1 h-9"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Observações</Label>
            <Input
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Ex: Compra na Shopee..."
              className="mt-1.5"
            />
          </div>

          {/* Breakdown */}
          <div className="bg-brand-50/50 rounded-xl p-3 border border-brand-100 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Subtotal itens</span>
              <span>{formatCurrency(subtotalInCents)}</span>
            </div>
            {freightInCents > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Frete</span>
                <span>+ {formatCurrency(freightInCents)}</span>
              </div>
            )}
            {surchargeInCents > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Acréscimo / juros</span>
                <span>+ {formatCurrency(surchargeInCents)}</span>
              </div>
            )}
            {discountInCents > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-600">
                <span>Desconto</span>
                <span>- {formatCurrency(discountInCents)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1.5 border-t border-brand-100 text-sm font-bold">
              <span>Total</span>
              <span className="text-brand-700">{formatCurrency(finalTotal)}</span>
            </div>
            {installmentCount > 1 && (
              <p className="text-[10px] text-muted-foreground pt-0.5">
                {installmentCount}x de {formatCurrency(newInstallmentAmount)}
              </p>
            )}
          </div>

          {/* Paid installments warning */}
          {paidCount > 0 && (
            <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-100">
              ⚠️ {paidCount} parcela{paidCount > 1 ? "s" : ""} já paga{paidCount > 1 ? "s" : ""}. O valor delas
              também será atualizado — registre no seu histórico financeiro se necessário.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              <ShoppingCart className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
