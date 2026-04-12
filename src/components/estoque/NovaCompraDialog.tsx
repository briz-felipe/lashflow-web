"use client";

import { useState, useMemo } from "react";
import {
  Calculator,
  ChevronLeft,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/formatters";
import {
  MATERIAL_CATEGORY_LABELS,
  MATERIAL_UNIT_LABELS,
} from "@/domain/enums";
import type { MaterialCategory, MaterialUnit } from "@/domain/enums";
import type { Material } from "@/domain/entities";
import { stockService, expenseService } from "@/services";
import { format } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CartItem {
  id: string; // temp id for React key
  /** null = new material to be created */
  materialId: string | null;
  materialName: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  minimumStock: number;
  quantity: number;
  unitPriceInCents: number;
}

type PaymentMode = "paid_now" | "other_date" | "installments";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: Material[];
  onComplete: () => Promise<void>;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIES = Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[];
const UNITS: MaterialUnit[] = ["un", "pacote", "caixa", "ml", "g", "par", "rolo", "kit"];
const PACKAGE_UNITS = new Set<MaterialUnit>(["pacote", "caixa", "kit", "rolo", "par"]);

let nextId = 1;
function tempId() {
  return `cart-${Date.now()}-${nextId++}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function NovaCompraDialog({ open, onOpenChange, materials, onComplete }: Props) {
  // Steps: "cart" | "payment"
  const [step, setStep] = useState<"cart" | "payment">("cart");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saving, setSaving] = useState(false);

  // ── Add item sub-form state ──
  const [addingItem, setAddingItem] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<MaterialCategory>("material");
  const [newUnit, setNewUnit] = useState<MaterialUnit>("un");
  const [newMinStock, setNewMinStock] = useState("0");
  const [itemQty, setItemQty] = useState("1");
  const [itemUnitPrice, setItemUnitPrice] = useState("");
  // Package calculator
  const [pkgItems, setPkgItems] = useState("");
  const [pkgTotal, setPkgTotal] = useState("");

  // ── Payment state ──
  const [purchaseName, setPurchaseName] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("paid_now");
  const [dueDay, setDueDay] = useState("");
  const [installmentCount, setInstallmentCount] = useState("2");
  const [notes, setNotes] = useState("");

  // ── Derived ──
  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity * i.unitPriceInCents, 0),
    [cart],
  );

  const filteredMaterials = useMemo(() => {
    if (!itemSearch.trim()) return materials;
    const s = itemSearch.toLowerCase();
    return materials.filter((m) => m.name.toLowerCase().includes(s));
  }, [materials, itemSearch]);

  const currentUnit = creatingNew ? newUnit : selectedMaterial?.unit ?? "un";
  const isPackageUnit = PACKAGE_UNITS.has(currentUnit);

  // ── Reset helpers ──
  function resetItemForm() {
    setItemSearch("");
    setSelectedMaterial(null);
    setCreatingNew(false);
    setNewName("");
    setNewCategory("material");
    setNewUnit("un");
    setNewMinStock("0");
    setItemQty("1");
    setItemUnitPrice("");
    setPkgItems("");
    setPkgTotal("");
    setAddingItem(false);
  }

  function resetAll() {
    setStep("cart");
    setCart([]);
    resetItemForm();
    setPurchaseName("");
    setPaymentMode("paid_now");
    setDueDay("");
    setInstallmentCount("2");
    setNotes("");
    setSaving(false);
  }

  function handleClose(o: boolean) {
    if (!o) resetAll();
    onOpenChange(o);
  }

  // ── Add item to cart ──
  function handleAddToCart() {
    const qty = parseInt(itemQty) || 0;
    if (qty <= 0) {
      toast({ title: "Quantidade deve ser maior que 0", variant: "destructive" });
      return;
    }

    let unitPriceInCents: number;
    if (isPackageUnit && pkgItems && pkgTotal) {
      const items = parseInt(pkgItems) || 0;
      const total = parseFloat(pkgTotal) || 0;
      if (items <= 0 || total <= 0) {
        toast({ title: "Preencha os campos do pacote", variant: "destructive" });
        return;
      }
      unitPriceInCents = Math.round((total / items) * 100);
    } else {
      unitPriceInCents = Math.round((parseFloat(itemUnitPrice) || 0) * 100);
    }

    if (unitPriceInCents <= 0) {
      toast({ title: "Informe o valor unitário", variant: "destructive" });
      return;
    }

    if (creatingNew) {
      if (!newName.trim()) {
        toast({ title: "Nome do material é obrigatório", variant: "destructive" });
        return;
      }
      setCart((prev) => [
        ...prev,
        {
          id: tempId(),
          materialId: null,
          materialName: newName.trim(),
          category: newCategory,
          unit: newUnit,
          minimumStock: parseInt(newMinStock) || 0,
          quantity: qty,
          unitPriceInCents,
        },
      ]);
    } else if (selectedMaterial) {
      setCart((prev) => [
        ...prev,
        {
          id: tempId(),
          materialId: selectedMaterial.id,
          materialName: selectedMaterial.name,
          category: selectedMaterial.category,
          unit: selectedMaterial.unit,
          minimumStock: selectedMaterial.minimumStock,
          quantity: qty,
          unitPriceInCents,
        },
      ]);
    } else {
      toast({ title: "Selecione ou crie um material", variant: "destructive" });
      return;
    }

    resetItemForm();
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  // ── Go to payment step ──
  function goToPayment() {
    if (cart.length === 0) {
      toast({ title: "Adicione pelo menos um item", variant: "destructive" });
      return;
    }
    // Auto-suggest purchase name
    if (!purchaseName) {
      const names = cart.map((i) => i.materialName);
      setPurchaseName(
        names.length <= 2
          ? `Compra: ${names.join(" + ")}`
          : `Compra: ${names[0]} + ${names.length - 1} itens`,
      );
    }
    setStep("payment");
  }

  // ── Submit ──
  async function handleSubmit() {
    if (!purchaseName.trim()) {
      toast({ title: "Nome da compra é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // 1. Create new materials
      const materialIdMap = new Map<string, string>(); // cartItemId -> realMaterialId
      for (const item of cart) {
        if (item.materialId) {
          materialIdMap.set(item.id, item.materialId);
        } else {
          const created = await stockService.createMaterial({
            name: item.materialName,
            category: item.category,
            unit: item.unit,
            unitCostInCents: item.unitPriceInCents,
            minimumStock: item.minimumStock,
          });
          materialIdMap.set(item.id, created.id);
        }
      }

      // 2. Create expense
      const currentMonth = format(new Date(), "yyyy-MM");
      const installments =
        paymentMode === "installments" ? parseInt(installmentCount) || 2 : undefined;
      const dueDayNum = dueDay ? parseInt(dueDay) : undefined;

      const expense = await expenseService.createExpense({
        name: purchaseName.trim(),
        category: "material",
        amountInCents:
          installments && installments > 1
            ? Math.round(cartTotal / installments)
            : cartTotal,
        recurrence: installments && installments > 1 ? "monthly" : "one_time",
        dueDay: dueDayNum,
        referenceMonth: currentMonth,
        notes: notes || undefined,
        installments,
      });

      // 3. Create stock movements for each cart item
      for (const item of cart) {
        const realMaterialId = materialIdMap.get(item.id)!;
        await stockService.createMovement({
          materialId: realMaterialId,
          type: "purchase",
          quantity: item.quantity,
          unitCostInCents: item.unitPriceInCents,
          notes: notes || undefined,
          expenseId: expense.id,
        });
      }

      // 4. Mark as paid if applicable
      if (paymentMode === "paid_now") {
        await expenseService.markAsPaid(expense.id);
      }

      // 5. Reload
      await onComplete();
      toast({ title: "Compra registrada com sucesso!", variant: "success" });
      handleClose(false);
    } catch (err) {
      console.error("[NovaCompra] submit error:", err);
      toast({ title: "Erro ao registrar compra", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-700">
            <ShoppingCart className="w-4 h-4" />
            {step === "cart" ? "Nova Compra" : "Pagamento"}
          </DialogTitle>
        </DialogHeader>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STEP 1 — Cart                                                      */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {step === "cart" && (
          <div className="space-y-4 mt-2">
            {/* Cart items list */}
            {cart.length > 0 && (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-brand-50/50 rounded-xl px-3 py-2.5 border border-brand-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.materialName}
                        {!item.materialId && (
                          <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
                            NOVO
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity}x {formatCurrency(item.unitPriceInCents)} = {formatCurrency(item.quantity * item.unitPriceInCents)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {/* Cart total */}
                <div className="flex items-center justify-between px-3 py-2 bg-brand-100/50 rounded-xl">
                  <span className="text-sm font-semibold text-brand-700">Total</span>
                  <span className="text-sm font-bold text-brand-800">{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            )}

            {/* ── Add item form ── */}
            {addingItem ? (
              <div className="border border-brand-200 rounded-xl p-3 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-brand-700">Adicionar item</p>
                  <button onClick={resetItemForm} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Material selection — search + list or create new */}
                {!selectedMaterial && !creatingNew && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar material..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="pl-9 h-9"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-brand-50 p-1">
                      {filteredMaterials.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedMaterial(m);
                            setItemSearch("");
                          }}
                          className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-brand-50 transition-colors"
                        >
                          <Package className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {MATERIAL_CATEGORY_LABELS[m.category]} · Estoque: {m.currentStock} {MATERIAL_UNIT_LABELS[m.unit]}
                            </p>
                          </div>
                        </button>
                      ))}
                      {filteredMaterials.length === 0 && itemSearch && (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          Nenhum material encontrado
                        </p>
                      )}
                      {/* Create new option */}
                      <button
                        onClick={() => {
                          setCreatingNew(true);
                          setNewName(itemSearch);
                          setItemSearch("");
                        }}
                        className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-700"
                      >
                        <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          Criar novo material{itemSearch ? `: "${itemSearch}"` : ""}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected existing material badge */}
                {selectedMaterial && (
                  <div className="flex items-center gap-2 bg-brand-50 rounded-lg px-3 py-2">
                    <Package className="w-4 h-4 text-brand-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedMaterial.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Estoque: {selectedMaterial.currentStock} {MATERIAL_UNIT_LABELS[selectedMaterial.unit]}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedMaterial(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* New material inline form */}
                {creatingNew && (
                  <div className="space-y-2 p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-emerald-700">Novo material</p>
                      <button
                        onClick={() => { setCreatingNew(false); setNewName(""); }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <Input
                        placeholder="Nome do material *"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-9 text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Categoria</Label>
                        <Select value={newCategory} onValueChange={(v) => setNewCategory(v as MaterialCategory)}>
                          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>{MATERIAL_CATEGORY_LABELS[c]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Unidade</Label>
                        <Select value={newUnit} onValueChange={(v) => setNewUnit(v as MaterialUnit)}>
                          <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {UNITS.map((u) => (
                              <SelectItem key={u} value={u}>{MATERIAL_UNIT_LABELS[u]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Alerta (min)</Label>
                      <Input
                        type="number"
                        value={newMinStock}
                        onChange={(e) => setNewMinStock(e.target.value)}
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Quantity + Price (show when material selected or creating new) */}
                {(selectedMaterial || creatingNew) && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={itemQty}
                          onChange={(e) => setItemQty(e.target.value)}
                          className="mt-1 h-9"
                        />
                      </div>
                      {!isPackageUnit && (
                        <div>
                          <Label className="text-xs">Valor unit. (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={itemUnitPrice}
                            onChange={(e) => setItemUnitPrice(e.target.value)}
                            placeholder="0,00"
                            className="mt-1 h-9"
                          />
                        </div>
                      )}
                    </div>

                    {/* Package calculator */}
                    {isPackageUnit && (
                      <div className="p-2.5 bg-brand-50 rounded-lg border border-brand-100 space-y-2">
                        <p className="text-xs font-semibold text-brand-700 flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5" /> Calcular valor unitario
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px]">Itens no {MATERIAL_UNIT_LABELS[currentUnit].toLowerCase()}</Label>
                            <Input
                              type="number"
                              value={pkgItems}
                              onChange={(e) => setPkgItems(e.target.value)}
                              placeholder="Ex: 10"
                              className="mt-0.5 h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Valor total (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={pkgTotal}
                              onChange={(e) => setPkgTotal(e.target.value)}
                              placeholder="Ex: 25,00"
                              className="mt-0.5 h-8 text-xs"
                            />
                          </div>
                        </div>
                        {pkgItems && pkgTotal && (
                          <p className="text-xs text-brand-600 font-medium">
                            = {formatCurrency(Math.round(((parseFloat(pkgTotal) || 0) / (parseInt(pkgItems) || 1)) * 100))} por unidade
                          </p>
                        )}
                      </div>
                    )}

                    {/* Subtotal preview */}
                    {(() => {
                      const qty = parseInt(itemQty) || 0;
                      let unitCents: number;
                      if (isPackageUnit && pkgItems && pkgTotal) {
                        unitCents = Math.round(((parseFloat(pkgTotal) || 0) / (parseInt(pkgItems) || 1)) * 100);
                      } else {
                        unitCents = Math.round((parseFloat(itemUnitPrice) || 0) * 100);
                      }
                      const sub = qty * unitCents;
                      return sub > 0 ? (
                        <p className="text-xs font-medium text-right text-muted-foreground">
                          Subtotal: {formatCurrency(sub)}
                        </p>
                      ) : null;
                    })()}

                    <Button size="sm" className="w-full" onClick={handleAddToCart}>
                      <Plus className="w-4 h-4" /> Adicionar ao carrinho
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-11 border-dashed border-brand-200 text-brand-600 hover:bg-brand-50"
                onClick={() => setAddingItem(true)}
              >
                <Plus className="w-4 h-4" /> Adicionar item
              </Button>
            )}

            {/* Continue button */}
            {cart.length > 0 && (
              <Button className="w-full h-11" onClick={goToPayment}>
                Continuar para pagamento
              </Button>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* STEP 2 — Payment                                                   */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {step === "payment" && (
          <div className="space-y-4 mt-2">
            {/* Back button */}
            <button
              onClick={() => setStep("cart")}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Voltar ao carrinho
            </button>

            {/* Cart summary */}
            <div className="bg-brand-50/50 rounded-xl p-3 border border-brand-100 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Resumo</p>
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600 flex-shrink-0">
                      {item.quantity}
                    </span>
                    <span className="truncate">{item.materialName}</span>
                  </span>
                  <span className="text-muted-foreground flex-shrink-0 ml-2">
                    {formatCurrency(item.quantity * item.unitPriceInCents)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1.5 border-t border-brand-100 text-sm font-bold">
                <span>Total</span>
                <span className="text-brand-700">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            {/* Purchase name */}
            <div>
              <Label>Nome da compra *</Label>
              <Input
                value={purchaseName}
                onChange={(e) => setPurchaseName(e.target.value)}
                placeholder="Ex: Compra de materiais descartaveis"
                className="mt-1.5"
              />
            </div>

            {/* Payment mode */}
            <div>
              <Label>Forma de pagamento</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {([
                  { value: "paid_now" as const, label: "Pago neste mes", desc: "Marca como pago automaticamente" },
                  { value: "other_date" as const, label: "A pagar", desc: "Definir dia de vencimento" },
                  { value: "installments" as const, label: "Parcelado", desc: "Dividir em parcelas mensais" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentMode(opt.value)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                      paymentMode === opt.value
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                        : "border-brand-100 hover:border-brand-200"
                    }`}
                  >
                    <p className={`text-sm font-medium ${paymentMode === opt.value ? "text-brand-700" : ""}`}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Due day (for other_date and installments) */}
            {(paymentMode === "other_date" || paymentMode === "installments") && (
              <div className={paymentMode === "installments" ? "grid grid-cols-2 gap-3" : ""}>
                <div>
                  <Label>Dia de vencimento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    placeholder="Ex: 15"
                    className="mt-1.5"
                  />
                </div>
                {paymentMode === "installments" && (
                  <div>
                    <Label>Parcelas</Label>
                    <Input
                      type="number"
                      min="2"
                      max="24"
                      value={installmentCount}
                      onChange={(e) => setInstallmentCount(e.target.value)}
                      placeholder="Ex: 3"
                      className="mt-1.5"
                    />
                    {parseInt(installmentCount) > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {installmentCount}x de {formatCurrency(Math.round(cartTotal / (parseInt(installmentCount) || 1)))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <Label>Observacoes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Compra na Shopee, reposicao mensal..."
                className="mt-1.5"
              />
            </div>

            {/* Submit */}
            <Button className="w-full h-11" onClick={handleSubmit} disabled={saving}>
              <ShoppingCart className="w-4 h-4" />
              {saving ? "Finalizando..." : `Finalizar Compra · ${formatCurrency(cartTotal)}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
