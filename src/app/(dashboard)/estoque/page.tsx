"use client";

import {
  AlertTriangle,
  DollarSign,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Pencil,
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
import { expenseService } from "@/services";
import Link from "next/link";
import type { MaterialPurchase, LinkedMaterialItem } from "@/services/interfaces/IExpenseService";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { NovaCompraDialog } from "@/components/estoque/NovaCompraDialog";

const CATEGORIES = Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[];
const UNITS: MaterialUnit[] = ["un", "pacote", "caixa", "ml", "g", "par", "rolo", "kit"];

type Tab = "materials" | "purchases";

export default function EstoquePage() {
  const [tab, setTab] = useState<Tab>("materials");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<MaterialCategory | "all">("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [compraOpen, setCompraOpen] = useState(false);
  const [editMat, setEditMat] = useState<Material | null>(null);
  const [saving, setSaving] = useState(false);

  // Quick usage state
  const [usageMat, setUsageMat] = useState<Material | null>(null);
  const [usageQty, setUsageQty] = useState("1");

  const { materials, loading, reload: reloadMaterials, updateMaterial, deleteMaterial, createMovement } = useStock({
    search: search || undefined,
    category: catFilter !== "all" ? catFilter : undefined,
    lowStock: lowStockOnly || undefined,
  });
  const { alerts, reload: reloadAlerts } = useStockAlerts();
  const { monthlyCosts, totalValue, loading: analyticsLoading, reload: reloadAnalytics } = useStockAnalytics();

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

  // ── Edit material ──
  const [editForm, setEditForm] = useState({ name: "", category: "" as MaterialCategory, unit: "" as MaterialUnit, minimumStock: "", notes: "" });

  function openEditModal(mat: Material) {
    setEditForm({
      name: mat.name,
      category: mat.category,
      unit: mat.unit,
      minimumStock: String(mat.minimumStock),
      notes: mat.notes ?? "",
    });
    setEditMat(mat);
  }

  const handleUpdateMaterial = async () => {
    if (!editMat || !editForm.name.trim()) return;
    setSaving(true);
    try {
      await updateMaterial(editMat.id, {
        name: editForm.name,
        category: editForm.category,
        unit: editForm.unit,
        minimumStock: parseInt(editForm.minimumStock) || 0,
        notes: editForm.notes || undefined,
      });
      toast({ title: "Material atualizado!", variant: "success" });
      reloadAll();
      setEditMat(null);
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMaterial = async (mat: Material) => {
    if (!confirm(`Excluir "${mat.name}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await deleteMaterial(mat.id);
      toast({ title: "Material excluído!", variant: "success" });
      reloadAll();
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  // ── Quick usage ──
  const handleQuickUsage = async () => {
    if (!usageMat) return;
    const qty = parseInt(usageQty) || 0;
    if (qty <= 0) {
      toast({ title: "Quantidade deve ser maior que 0", variant: "destructive" });
      return;
    }
    if (qty > usageMat.currentStock) {
      toast({ title: `Estoque insuficiente (disponível: ${usageMat.currentStock})`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createMovement({
        materialId: usageMat.id,
        type: "usage",
        quantity: qty,
        unitCostInCents: usageMat.unitCostInCents,
      });
      toast({ title: `${qty} ${MATERIAL_UNIT_LABELS[usageMat.unit]} de "${usageMat.name}" registrado como uso`, variant: "success" });
      await reloadAll();
      setUsageMat(null);
      setUsageQty("1");
    } catch {
      toast({ title: "Erro ao registrar uso", variant: "destructive" });
    } finally {
      setSaving(false);
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
                  <div key={mat.id} className="bg-white rounded-2xl border border-brand-100 shadow-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{mat.name}</p>
                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                          {MATERIAL_CATEGORY_LABELS[mat.category]}
                        </span>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <p className={`text-lg font-bold ${isLow ? "text-red-600" : "text-emerald-600"}`}>
                          {mat.currentStock}
                          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline ml-1" />}
                        </p>
                        <p className="text-xs text-muted-foreground">{MATERIAL_UNIT_LABELS[mat.unit]}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-brand-50">
                      <span>Mín: {mat.minimumStock} · Unit: {formatCurrency(mat.unitCostInCents)}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(mat.currentStock * mat.unitCostInCents)}</span>
                    </div>
                    <div className="flex gap-2 mt-2 pt-2 border-t border-brand-50">
                      <button
                        onClick={() => { setUsageMat(mat); setUsageQty("1"); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Minus className="w-3 h-3" /> Uso
                      </button>
                      <button
                        onClick={() => openEditModal(mat)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(mat)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                    </div>
                  </div>
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
                      <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3 w-28">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    {materials.map((mat) => {
                      const isLow = mat.minimumStock > 0 && mat.currentStock <= mat.minimumStock;
                      return (
                        <tr key={mat.id} className="hover:bg-brand-50/50 transition-colors">
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
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => { setUsageMat(mat); setUsageQty("1"); }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-50 text-muted-foreground hover:text-amber-600 transition-colors"
                                title="Registrar uso"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(mat)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-50 text-muted-foreground hover:text-brand-600 transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(mat)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {materials.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
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

                        <div className="pt-1">
                          <Link
                            href="/despesas?tab=material"
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline"
                          >
                            Ver em Despesas &rarr;
                          </Link>
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

      {/* ── Modal: Editar Material ── */}
      <Dialog open={!!editMat} onOpenChange={(o) => { if (!o) setEditMat(null); }}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-700">
              <Pencil className="w-4 h-4" /> Editar Material
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label>Nome *</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm((f) => ({ ...f, category: v as MaterialCategory }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{MATERIAL_CATEGORY_LABELS[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade</Label>
                <Select value={editForm.unit} onValueChange={(v) => setEditForm((f) => ({ ...f, unit: v as MaterialUnit }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{MATERIAL_UNIT_LABELS[u]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Alerta (mín)</Label>
              <Input type="number" value={editForm.minimumStock} onChange={(e) => setEditForm((f) => ({ ...f, minimumStock: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Observações</Label>
              <Input value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Observações opcionais" className="mt-1.5" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditMat(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleUpdateMaterial} disabled={saving || !editForm.name.trim()}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Uso rápido ── */}
      <Dialog open={!!usageMat} onOpenChange={(o) => { if (!o) { setUsageMat(null); setUsageQty("1"); } }}>
        <DialogContent className="max-w-sm w-[calc(100%-2rem)] mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <Minus className="w-4 h-4" /> Registrar Uso
            </DialogTitle>
          </DialogHeader>
          {usageMat && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3 bg-brand-50/50 rounded-xl px-3 py-2.5 border border-brand-100">
                <Package className="w-5 h-5 text-brand-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{usageMat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Disponível: {usageMat.currentStock} {MATERIAL_UNIT_LABELS[usageMat.unit]}
                  </p>
                </div>
              </div>
              <div>
                <Label>Quantidade *</Label>
                <Input
                  type="number" min="1" max={usageMat.currentStock}
                  value={usageQty}
                  onChange={(e) => setUsageQty(e.target.value)}
                  className="mt-1.5"
                  autoFocus
                />
              </div>
              <Button className="w-full h-11" onClick={handleQuickUsage} disabled={saving}>
                <Minus className="w-4 h-4" />
                {saving ? "Registrando..." : `Retirar ${parseInt(usageQty) || 0} ${MATERIAL_UNIT_LABELS[usageMat.unit]}`}
              </Button>
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
    </div>
  );
}
