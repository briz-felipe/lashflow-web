"use client";

import {
  AlertTriangle,
  ChevronRight,
  DollarSign,
  Minus,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MATERIAL_CATEGORY_LABELS,
  MATERIAL_UNIT_LABELS,
} from "@/domain/enums";
import type { MaterialCategory, MaterialUnit } from "@/domain/enums";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";
import { useStock, useStockAlerts, useStockAnalytics } from "@/hooks/useStock";
import type { Material } from "@/domain/entities";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Topbar } from "@/components/layout/Topbar";
import { toast } from "@/components/ui/toaster";
import { useState, useEffect, useCallback } from "react";
import { expenseService, stockService } from "@/services";
import Link from "next/link";
import type { MaterialPurchase, LinkedMaterialItem } from "@/services/interfaces/IExpenseService";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { NovaCompraDialog } from "@/components/estoque/NovaCompraDialog";
import { EditarCompraDialog } from "@/components/estoque/EditarCompraDialog";

const CATEGORIES = Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[];
const UNITS: MaterialUnit[] = ["un", "pacote", "caixa", "ml", "g", "par", "rolo", "kit"];

type Tab = "materials" | "purchases";

export default function EstoquePage() {
  const [tab, setTab] = useState<Tab>("materials");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<MaterialCategory | "all">("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [compraOpen, setCompraOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Material detail modal
  const [selectedMat, setSelectedMat] = useState<Material | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", category: "" as MaterialCategory, unit: "" as MaterialUnit, minimumStock: "", notes: "" });

  const { materials, loading, reload: reloadMaterials, updateMaterial, deleteMaterial, createMovement } = useStock({
    search: search || undefined,
    category: catFilter !== "all" ? catFilter : undefined,
    lowStock: lowStockOnly || undefined,
  });
  const { alerts, reload: reloadAlerts } = useStockAlerts();
  const { monthlyCosts, totalValue, loading: analyticsLoading, reload: reloadAnalytics } = useStockAnalytics();

  // Refresh selectedMat directly from API after mutations
  const refreshSelectedMat = useCallback(async (matId: string) => {
    const fresh = await stockService.getMaterialById(matId);
    if (fresh) setSelectedMat(fresh);
    else setSelectedMat(null);
  }, []);

  // Purchases tab: group installments into single purchase cards
  interface PurchaseGroup {
    id: string;
    name: string;
    installments: MaterialPurchase[];
    linkedMaterials: LinkedMaterialItem[];
    totalAmountInCents: number;
    paidCount: number;
    totalInstallments: number;
    installmentAmountInCents: number;
    createdAt: Date;
  }
  const [purchaseGroups, setPurchaseGroups] = useState<PurchaseGroup[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchaseExpanded, setPurchaseExpanded] = useState<string | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseGroup | null>(null);

  const loadPurchases = useCallback(async () => {
    setPurchasesLoading(true);
    try {
      const data = await expenseService.getMaterialPurchases();
      const groupMap = new Map<string, MaterialPurchase[]>();
      for (const p of data) {
        const key = p.expense.installmentGroupId || p.expense.id;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(p);
      }
      const groups: PurchaseGroup[] = Array.from(groupMap.entries()).map(([key, items]) => {
        items.sort((a, b) => (a.expense.installmentCurrent ?? 1) - (b.expense.installmentCurrent ?? 1));
        const first = items[0];
        const linkedMaterials = first.linkedMaterials.map((m) => ({ ...m }));
        return {
          id: key,
          name: first.expense.name,
          installments: items,
          linkedMaterials,
          totalAmountInCents: items.reduce((sum, i) => sum + i.expense.amountInCents, 0),
          paidCount: items.filter((i) => i.expense.isPaid).length,
          totalInstallments: items.length,
          installmentAmountInCents: first.expense.amountInCents,
          createdAt: new Date(first.expense.createdAt),
        };
      });
      groups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setPurchaseGroups(groups);
    } catch { /* silently fail */ }
    finally { setPurchasesLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "purchases" && purchaseGroups.length === 0) {
      loadPurchases();
    }
  }, [tab, purchaseGroups.length, loadPurchases]);

  // Reload all dependent data after any mutation
  const reloadAll = useCallback(async () => {
    await Promise.all([reloadMaterials(), reloadAlerts(), reloadAnalytics(), loadPurchases()]);
  }, [reloadMaterials, reloadAlerts, reloadAnalytics, loadPurchases]);

  // ── Open material detail modal ──
  function openMaterialDetail(mat: Material) {
    setSelectedMat(mat);
    setAdjustQty("");
    setEditMode(false);
    setEditForm({
      name: mat.name,
      category: mat.category,
      unit: mat.unit,
      minimumStock: String(mat.minimumStock),
      notes: mat.notes ?? "",
    });
  }

  function closeMaterialDetail() {
    setSelectedMat(null);
    setAdjustQty("");
    setEditMode(false);
  }

  // ── Quick +/- stock adjustment ──
  const handleStockAdjust = async (direction: "minus" | "plus") => {
    if (!selectedMat || saving) return;
    if (direction === "minus" && selectedMat.currentStock <= 0) {
      toast({ title: "Estoque já está zerado", variant: "destructive" });
      return;
    }
    const matId = selectedMat.id;
    setSaving(true);
    try {
      await createMovement({
        materialId: matId,
        type: direction === "minus" ? "usage" : "purchase",
        quantity: 1,
        unitCostInCents: selectedMat.unitCostInCents,
      });
      toast({
        title: direction === "minus"
          ? `−1 ${MATERIAL_UNIT_LABELS[selectedMat.unit]} de "${selectedMat.name}"`
          : `+1 ${MATERIAL_UNIT_LABELS[selectedMat.unit]} de "${selectedMat.name}"`,
        variant: "success",
      });
      await Promise.all([reloadAll(), refreshSelectedMat(matId)]);
    } catch {
      toast({ title: "Erro ao ajustar estoque", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Manual stock adjustment ──
  const handleManualAdjust = async () => {
    if (!selectedMat || saving) return;
    const target = parseInt(adjustQty);
    if (isNaN(target) || target < 0) {
      toast({ title: "Informe uma quantidade válida (≥ 0)", variant: "destructive" });
      return;
    }
    const diff = target - selectedMat.currentStock;
    if (diff === 0) {
      toast({ title: "Quantidade já é igual ao estoque atual", variant: "destructive" });
      return;
    }
    const matId = selectedMat.id;
    setSaving(true);
    try {
      await createMovement({
        materialId: matId,
        type: "adjustment",
        quantity: target,
        unitCostInCents: selectedMat.unitCostInCents,
        notes: `Ajuste manual: ${selectedMat.currentStock} → ${target}`,
      });
      toast({ title: `Estoque ajustado para ${target} ${MATERIAL_UNIT_LABELS[selectedMat.unit]}`, variant: "success" });
      setAdjustQty("");
      await Promise.all([reloadAll(), refreshSelectedMat(matId)]);
    } catch {
      toast({ title: "Erro ao ajustar estoque", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Update material metadata ──
  const handleUpdateMaterial = async () => {
    if (!selectedMat || !editForm.name.trim()) return;
    const matId = selectedMat.id;
    setSaving(true);
    try {
      await updateMaterial(selectedMat.id, {
        name: editForm.name,
        category: editForm.category,
        unit: editForm.unit,
        minimumStock: parseInt(editForm.minimumStock) || 0,
        notes: editForm.notes || undefined,
      });
      toast({ title: "Material atualizado!", variant: "success" });
      setEditMode(false);
      await Promise.all([reloadAll(), refreshSelectedMat(matId)]);
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete material ──
  const handleDeleteMaterial = async () => {
    if (!selectedMat) return;
    if (!confirm(`Excluir "${selectedMat.name}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await deleteMaterial(selectedMat.id);
      toast({ title: "Material excluído!", variant: "success" });
      closeMaterialDetail();
      await reloadAll();
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  if (loading && analyticsLoading) return <LoadingPage />;

  const thisMonthCost = monthlyCosts.length > 0 ? monthlyCosts[monthlyCosts.length - 1].totalCostInCents : 0;

  return (
    <div>
      <Topbar title="Estoque" subtitle="Materiais e insumos" />

      <div className="p-4 sm:p-6 animate-fade-in space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatsCard title="Materiais" value={String(materials.length)} icon={<Package className="w-5 h-5" />} color="purple" />
          <StatsCard title="Estoque Baixo" value={String(alerts.length)} icon={<AlertTriangle className="w-5 h-5" />} color={alerts.length > 0 ? "red" : "green"} />
          <StatsCard title="Valor em Estoque" value={formatCurrency(totalValue)} icon={<DollarSign className="w-5 h-5" />} color="blue" />
          <StatsCard title="Entradas no Mês" value={formatCurrency(thisMonthCost)} icon={<ShoppingCart className="w-5 h-5" />} color="amber" />
        </div>

        {/* Low stock alerts */}
        {alerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-amber-800">
                Estoque Baixo — {alerts.length} {alerts.length === 1 ? "item" : "itens"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {alerts.map((a) => (
                <span key={a.materialId} className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                  {a.materialName} — {a.currentStock} de {a.minimumStock}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs + actions */}
        <div className="flex items-center gap-2">
          <div className="flex bg-brand-50 rounded-xl p-1 gap-1 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            <button
              onClick={() => setTab("materials")}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                tab === "materials"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-muted-foreground hover:text-brand-600"
              }`}
            >
              <Package className="w-4 h-4" /> Estoque
            </button>
            <button
              onClick={() => setTab("purchases")}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                tab === "purchases"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-muted-foreground hover:text-brand-600"
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> Compras
            </button>
          </div>

          <Button size="sm" onClick={() => setCompraOpen(true)}>
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Compra</span>
          </Button>
        </div>

        {/* ── Estoque Tab ── */}
        {tab === "materials" && (
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <Select value={catFilter} onValueChange={(v) => setCatFilter(v as MaterialCategory | "all")}>
                <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{MATERIAL_CATEGORY_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant={lowStockOnly ? "default" : "outline"} size="sm" onClick={() => setLowStockOnly(!lowStockOnly)} className="h-9 px-3">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Estoque Baixo</span>
              </Button>
            </div>

            {/* Mobile: cards */}
            <div className="sm:hidden space-y-2">
              {materials.map((mat) => {
                const isLow = mat.minimumStock > 0 && mat.currentStock <= mat.minimumStock;
                return (
                  <button
                    key={mat.id}
                    onClick={() => openMaterialDetail(mat)}
                    className="w-full text-left bg-white rounded-2xl border border-brand-100 shadow-card p-4 hover:border-brand-200 active:bg-brand-50/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{mat.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                            {MATERIAL_CATEGORY_LABELS[mat.category]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(mat.unitCostInCents)}/{MATERIAL_UNIT_LABELS[mat.unit]}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xl font-bold ${isLow ? "text-red-600" : "text-emerald-600"}`}>
                          {mat.currentStock}
                          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline ml-1" />}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{MATERIAL_UNIT_LABELS[mat.unit]}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
              {materials.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum material cadastrado</p>
                  <p className="text-xs text-muted-foreground mt-1">Use &quot;Nova Compra&quot; para cadastrar e comprar</p>
                </div>
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-50">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Material</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Categoria</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Estoque</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Mínimo</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Custo Unit.</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    {materials.map((mat) => {
                      const isLow = mat.minimumStock > 0 && mat.currentStock <= mat.minimumStock;
                      return (
                        <tr
                          key={mat.id}
                          onClick={() => openMaterialDetail(mat)}
                          className="hover:bg-brand-50/50 transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium">{mat.name}</p>
                            <p className="text-xs text-muted-foreground">{MATERIAL_UNIT_LABELS[mat.unit]}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                              {MATERIAL_CATEGORY_LABELS[mat.category]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-bold ${isLow ? "text-red-600" : "text-emerald-600"}`}>
                              {mat.currentStock}
                            </span>
                            {isLow && <AlertTriangle className="w-3 h-3 text-amber-500 inline ml-1" />}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-muted-foreground hidden md:table-cell">
                            {mat.minimumStock}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-muted-foreground hidden md:table-cell">
                            {formatCurrency(mat.unitCostInCents)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-sm font-semibold">
                              {formatCurrency(mat.currentStock * mat.unitCostInCents)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {materials.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                          Nenhum material cadastrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Compras Tab ── */}
        {tab === "purchases" && (
          <div className="space-y-3">
            {purchasesLoading ? (
              <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>
            ) : purchaseGroups.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma compra registrada</p>
                <p className="text-xs text-muted-foreground mt-1">Use &quot;Nova Compra&quot; para registrar</p>
              </div>
            ) : (
              purchaseGroups.map((g) => {
                const isExpanded = purchaseExpanded === g.id;
                const subtotal = g.linkedMaterials.reduce((sum, item) => sum + item.totalCostInCents, 0);
                const allPaid = g.paidCount === g.totalInstallments;
                const isInstallment = g.totalInstallments > 1;
                return (
                  <div key={g.id} className={`bg-white rounded-2xl border shadow-card overflow-hidden transition-all ${
                    allPaid ? "border-emerald-100" : "border-amber-100"
                  }`}>
                    <button
                      onClick={() => setPurchaseExpanded(isExpanded ? null : g.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50/50 transition-colors text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        allPaid ? "bg-emerald-50" : "bg-amber-50"
                      }`}>
                        <ShoppingCart className={`w-4 h-4 ${allPaid ? "text-emerald-600" : "text-amber-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{g.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {allPaid ? (
                            <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Pago
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">
                              {g.paidCount}/{g.totalInstallments} pago{g.paidCount !== 1 ? "s" : ""}
                            </span>
                          )}
                          <span>{g.linkedMaterials.length} ite{g.linkedMaterials.length !== 1 ? "ns" : "m"}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold">{formatCurrency(g.totalAmountInCents)}</p>
                        {isInstallment && (
                          <p className="text-[10px] text-muted-foreground">{g.totalInstallments}x {formatCurrency(g.installmentAmountInCents)}</p>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-brand-50 px-4 py-3 space-y-3">
                        {isInstallment && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Parcelas</p>
                            <div className="flex flex-wrap gap-1.5">
                              {g.installments.map((inst, i) => (
                                <span
                                  key={i}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    inst.expense.isPaid
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {i + 1}x
                                  {inst.expense.isPaid ? (
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                  ) : (
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-brand-50/50 rounded-lg p-2">
                            <p className="text-muted-foreground">Valor total</p>
                            <p className="font-semibold">{formatCurrency(g.totalAmountInCents)}</p>
                          </div>
                          <div className="bg-brand-50/50 rounded-lg p-2">
                            <p className="text-muted-foreground">Pago</p>
                            <p className="font-semibold text-emerald-600">
                              {formatCurrency(g.installments.filter((i) => i.expense.isPaid).reduce((s, i) => s + i.expense.amountInCents, 0))}
                            </p>
                          </div>
                        </div>

                        {g.linkedMaterials.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">Itens da compra</p>
                            {g.linkedMaterials.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded bg-brand-50 flex items-center justify-center text-[10px] font-bold text-brand-600 flex-shrink-0">
                                    {item.quantity}
                                  </span>
                                  <span className="truncate">{item.materialName}</span>
                                </div>
                                <span className="text-muted-foreground flex-shrink-0">{formatCurrency(item.totalCostInCents)}</span>
                              </div>
                            ))}
                            {g.linkedMaterials.length > 1 && (
                              <div className="flex items-center justify-between text-xs pt-1.5 mt-1.5 border-t border-dashed border-brand-100">
                                <span className="text-muted-foreground">Subtotal itens</span>
                                <span className="font-semibold text-brand-700">{formatCurrency(subtotal)}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Nenhum material vinculado ainda.</p>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <Link
                            href="/despesas?tab=material"
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
                          >
                            Ver em Despesas &rarr;
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setEditingPurchase(g)}
                          >
                            <Pencil className="w-3 h-3" /> Editar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Modal: Detalhe do Material ── */}
      <Dialog open={!!selectedMat} onOpenChange={(o) => { if (!o) closeMaterialDetail(); }}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-700">
              <Package className="w-4 h-4" /> {selectedMat?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMat && (
            <div className="space-y-4 mt-2">
              {/* Material info */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                  {MATERIAL_CATEGORY_LABELS[selectedMat.category]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {MATERIAL_UNIT_LABELS[selectedMat.unit]} · {formatCurrency(selectedMat.unitCostInCents)}/un
                </span>
                {selectedMat.minimumStock > 0 && (
                  <span className="text-xs text-muted-foreground">
                    · Alerta: {selectedMat.minimumStock}
                  </span>
                )}
              </div>

              {/* Stock display + quick +/- */}
              <div className="bg-brand-50/50 rounded-2xl border border-brand-100 p-4">
                <p className="text-xs font-semibold text-muted-foreground text-center mb-3">Estoque Atual</p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => handleStockAdjust("minus")}
                    disabled={saving || selectedMat.currentStock <= 0}
                    className="w-12 h-12 rounded-xl bg-white border border-brand-200 flex items-center justify-center text-amber-600 hover:bg-amber-50 hover:border-amber-300 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="text-center min-w-[80px]">
                    <p className={`text-4xl font-bold tabular-nums ${
                      selectedMat.minimumStock > 0 && selectedMat.currentStock <= selectedMat.minimumStock
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}>
                      {selectedMat.currentStock}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{MATERIAL_UNIT_LABELS[selectedMat.unit]}</p>
                  </div>
                  <button
                    onClick={() => handleStockAdjust("plus")}
                    disabled={saving}
                    className="w-12 h-12 rounded-xl bg-white border border-brand-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {selectedMat.minimumStock > 0 && selectedMat.currentStock <= selectedMat.minimumStock && (
                  <p className="text-xs text-amber-600 font-medium text-center mt-2 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Estoque abaixo do mínimo ({selectedMat.minimumStock})
                  </p>
                )}
              </div>

              {/* Manual adjustment */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Ajuste manual</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    type="number"
                    min="0"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    placeholder={`Atual: ${selectedMat.currentStock}`}
                    className="flex-1 h-10"
                  />
                  <Button
                    variant="outline"
                    className="h-10 px-4"
                    onClick={handleManualAdjust}
                    disabled={saving || !adjustQty}
                  >
                    {saving ? "..." : "Ajustar"}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Digite a quantidade final desejada e clique em &quot;Ajustar&quot;
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-brand-100" />

              {/* Edit metadata toggle */}
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-brand-600 hover:bg-brand-50 transition-colors font-medium"
                >
                  <Pencil className="w-4 h-4" /> Editar dados do material
                </button>
              ) : (
                <div className="space-y-3 p-3 bg-brand-50/30 rounded-xl border border-brand-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-brand-700">Editar dados</p>
                    <button onClick={() => setEditMode(false)} className="text-xs text-muted-foreground hover:text-foreground">
                      Cancelar
                    </button>
                  </div>
                  <div>
                    <Label className="text-xs">Nome</Label>
                    <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 h-9" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Categoria</Label>
                      <Select value={editForm.category} onValueChange={(v) => setEditForm((f) => ({ ...f, category: v as MaterialCategory }))}>
                        <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{MATERIAL_CATEGORY_LABELS[c]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Unidade</Label>
                      <Select value={editForm.unit} onValueChange={(v) => setEditForm((f) => ({ ...f, unit: v as MaterialUnit }))}>
                        <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNITS.map((u) => <SelectItem key={u} value={u}>{MATERIAL_UNIT_LABELS[u]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Alerta (mín)</Label>
                      <Input type="number" value={editForm.minimumStock} onChange={(e) => setEditForm((f) => ({ ...f, minimumStock: e.target.value }))} className="mt-1 h-9" />
                    </div>
                    <div>
                      <Label className="text-xs">Observações</Label>
                      <Input value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Opcional" className="mt-1 h-9" />
                    </div>
                  </div>
                  <Button size="sm" className="w-full" onClick={handleUpdateMaterial} disabled={saving || !editForm.name.trim()}>
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </div>
              )}

              {/* Delete */}
              <button
                onClick={handleDeleteMaterial}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4" /> Excluir material
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Nova Compra (carrinho + pagamento) ── */}
      <NovaCompraDialog
        open={compraOpen}
        onOpenChange={setCompraOpen}
        materials={materials}
        onComplete={reloadAll}
      />

      {/* ── Editar Compra (checkout) ── */}
      <EditarCompraDialog
        open={!!editingPurchase}
        onOpenChange={(o) => { if (!o) setEditingPurchase(null); }}
        purchase={editingPurchase}
        onComplete={reloadAll}
      />
    </div>
  );
}
