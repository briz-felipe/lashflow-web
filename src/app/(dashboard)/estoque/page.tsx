"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  DollarSign,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  TrendingDown,
  Wrench,
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
  STOCK_MOVEMENT_TYPE_LABELS,
} from "@/domain/enums";
import type { MaterialCategory, MaterialUnit, StockMovementType } from "@/domain/enums";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useStock, useStockAlerts, useStockAnalytics, useStockMovements } from "@/hooks/useStock";
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
import type { Expense } from "@/domain/entities";
import type { MaterialPurchase } from "@/services/interfaces/IExpenseService";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORIES = Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[];
const UNITS: MaterialUnit[] = ["un", "pacote", "caixa", "ml", "g", "par", "rolo", "kit"];

const MOVEMENT_ICON: Record<StockMovementType, React.ReactNode> = {
  purchase:   <ArrowUpRight className="w-4 h-4 text-emerald-600" />,
  usage:      <ArrowDownRight className="w-4 h-4 text-red-500" />,
  adjustment: <Wrench className="w-4 h-4 text-amber-500" />,
};

const MOVEMENT_COLOR: Record<StockMovementType, string> = {
  purchase:   "text-emerald-600",
  usage:      "text-red-500",
  adjustment: "text-amber-600",
};

const MOVEMENT_BG: Record<StockMovementType, string> = {
  purchase:   "bg-emerald-50",
  usage:      "bg-red-50",
  adjustment: "bg-amber-50",
};

type Tab = "materials" | "movements" | "purchases";

const MAT_FORM_DEFAULT = {
  name: "", category: "material" as MaterialCategory, unit: "un" as MaterialUnit,
  minimumStock: "1", initialStock: "0", notes: "",
};
const MOV_FORM_DEFAULT = {
  materialId: "", type: "purchase" as StockMovementType,
  quantity: "1", unitPrice: "", notes: "",
  expenseId: "", // optional link to a material expense
};

// Units that typically come in bulk packages → show calculator instead of direct unit cost
const PACKAGE_UNITS = new Set<MaterialUnit>(["pacote", "caixa", "kit", "rolo", "par"]);

function calcFromPackage(pkgItems: string, pkgTotal: string): number {
  const items = parseInt(pkgItems) || 0;
  const total = parseFloat(pkgTotal) || 0;
  if (items <= 0 || total <= 0) return 0;
  return Math.round((total / items) * 100);
}

export default function EstoquePage() {
  const [tab, setTab] = useState<Tab>("materials");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<MaterialCategory | "all">("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [matOpen, setMatOpen] = useState(false);
  const [movOpen, setMovOpen] = useState(false);
  const [editMat, setEditMat] = useState<Material | null>(null);
  const [saving, setSaving] = useState(false);

  const { materials, loading, createMaterial, updateMaterial, deleteMaterial, createMovement } = useStock({
    search: search || undefined,
    category: catFilter !== "all" ? catFilter : undefined,
    lowStock: lowStockOnly || undefined,
  });
  const { movements, loading: movLoading, reload: reloadMovements, updateMovement, deleteMovement } = useStockMovements();
  const { alerts, reload: reloadAlerts } = useStockAlerts();
  const { monthlyCosts, totalValue, loading: analyticsLoading, reload: reloadAnalytics } = useStockAnalytics();

  // Reload all dependent data after any mutation
  const reloadAll = useCallback(async () => {
    await Promise.all([reloadMovements(), reloadAlerts(), reloadAnalytics()]);
  }, [reloadMovements, reloadAlerts, reloadAnalytics]);

  const [matForm, setMatForm] = useState(MAT_FORM_DEFAULT);
  const [movForm, setMovForm] = useState(MOV_FORM_DEFAULT);

  // Material expenses for linking purchases (deduplicated by installment group)
  const [materialExpenses, setMaterialExpenses] = useState<Expense[]>([]);
  useEffect(() => {
    expenseService.listExpenses({ category: "material" as import("@/domain/enums").ExpenseCategory }).then((all) => {
      // Group by installment_group_id — show only the first installment per group
      const seen = new Set<string>();
      const deduped = all.filter((exp) => {
        if (exp.installmentGroupId) {
          if (seen.has(exp.installmentGroupId)) return false;
          seen.add(exp.installmentGroupId);
        }
        return true;
      });
      setMaterialExpenses(deduped);
    }).catch(() => {});
  }, []);

  // Purchases tab: material purchases with linked items (most recent first)
  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchaseExpanded, setPurchaseExpanded] = useState<string | null>(null);

  const loadPurchases = useCallback(async () => {
    setPurchasesLoading(true);
    try {
      const data = await expenseService.getMaterialPurchases();
      // Sort by newest first
      data.sort((a, b) => new Date(b.expense.createdAt).getTime() - new Date(a.expense.createdAt).getTime());
      setPurchases(data);
    } catch { /* silently fail */ }
    finally { setPurchasesLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "purchases" && purchases.length === 0) {
      loadPurchases();
    }
  }, [tab, purchases.length, loadPurchases]);

  const handleCreateMaterial = async () => {
    if (!matForm.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createMaterial({
        name: matForm.name,
        category: matForm.category,
        unit: matForm.unit,
        unitCostInCents: 0,
        minimumStock: parseInt(matForm.minimumStock) || 1,
        initialStock: parseInt(matForm.initialStock) || 0,
        notes: matForm.notes || undefined,
      });
      toast({ title: "Material cadastrado!", variant: "success" });
      reloadAll();
      setMatForm(MAT_FORM_DEFAULT);
      setMatOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Edit material ────────────────────────────────────────────────────────────
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
        minimumStock: parseInt(editForm.minimumStock) || 1,
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

  const handleCreateMovement = async () => {
    if (!movForm.materialId) {
      toast({ title: "Selecione um material", variant: "destructive" });
      return;
    }
    const qty = parseInt(movForm.quantity) || 0;
    if (qty <= 0) {
      toast({ title: "Quantidade deve ser maior que 0", variant: "destructive" });
      return;
    }
    const selectedMat = materials.find((m) => m.id === movForm.materialId);
    const cost = movForm.type === "purchase"
      ? Math.round(parseFloat(movForm.unitPrice || "0") * 100)
      : selectedMat?.unitCostInCents ?? 0;

    setSaving(true);
    try {
      await createMovement({
        materialId: movForm.materialId,
        type: movForm.type,
        quantity: qty,
        unitCostInCents: cost,
        notes: movForm.notes || undefined,
        expenseId: movForm.expenseId || undefined,
      });
      await reloadAll();
      toast({ title: `${STOCK_MOVEMENT_TYPE_LABELS[movForm.type]} registrada!`, variant: "success" });
      setMovForm(MOV_FORM_DEFAULT);
      setMovOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMovement = async (id: string) => {
    try {
      await deleteMovement(id);
      await reloadAll();
      toast({ title: "Movimentação removida", variant: "success" });
    } catch {
      toast({ title: "Erro ao remover movimentação", variant: "destructive" });
    }
  };

  if (loading && analyticsLoading) return <LoadingPage />;

  const thisMonthCost = monthlyCosts.length > 0 ? monthlyCosts[monthlyCosts.length - 1].totalCostInCents : 0;

  return (
    <div>
      <Topbar title="Estoque" subtitle="Materiais e insumos" />

      <div className="p-4 sm:p-6 animate-fade-in space-y-4">

        {/* Stats — 2×2 on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatsCard
            title="Materiais"
            value={String(materials.length)}
            icon={<Package className="w-5 h-5" />}
            color="purple"
          />
          <StatsCard
            title="Estoque Baixo"
            value={String(alerts.length)}
            icon={<AlertTriangle className="w-5 h-5" />}
            color={alerts.length > 0 ? "red" : "green"}
          />
          <StatsCard
            title="Valor em Estoque"
            value={formatCurrency(totalValue)}
            icon={<DollarSign className="w-5 h-5" />}
            color="blue"
          />
          <StatsCard
            title="Entradas no Mês"
            value={formatCurrency(thisMonthCost)}
            icon={<ShoppingCart className="w-5 h-5" />}
            color="amber"
          />
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
          <div className="flex bg-brand-50 rounded-xl p-1 gap-1 flex-1 sm:flex-none">
            <button
              onClick={() => setTab("materials")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "materials"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-muted-foreground hover:text-brand-600"
              }`}
            >
              <Package className="w-4 h-4" /> Materiais
            </button>
            <button
              onClick={() => setTab("movements")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "movements"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-muted-foreground hover:text-brand-600"
              }`}
            >
              <TrendingDown className="w-4 h-4" /> Movimentações
            </button>
            <button
              onClick={() => setTab("purchases")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === "purchases"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-muted-foreground hover:text-brand-600"
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> Compras
            </button>
          </div>

          <div className="flex gap-2 ml-auto">
            {tab === "materials" && (
              <Button size="sm" onClick={() => setMatOpen(true)}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Novo Material</span>
              </Button>
            )}
            {tab === "movements" && (
              <Button size="sm" onClick={() => setMovOpen(true)}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Registrar Movimento</span>
              </Button>
            )}
          </div>
        </div>

        {/* ── Materials Tab ── */}
        {tab === "materials" && (
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={catFilter} onValueChange={(v) => setCatFilter(v as MaterialCategory | "all")}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{MATERIAL_CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={lowStockOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className="h-9 px-3"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Estoque Baixo</span>
              </Button>
            </div>

            {/* Mobile: cards */}
            <div className="sm:hidden space-y-2">
              {materials.map((mat) => {
                const isLow = mat.currentStock <= mat.minimumStock;
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
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum material encontrado</p>
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
                      <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3 w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    {materials.map((mat) => {
                      const isLow = mat.currentStock <= mat.minimumStock;
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
                          Nenhum material encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Movements Tab ── */}
        {tab === "movements" && (
          <div className="space-y-3">
            {/* Mobile: cards */}
            <div className="sm:hidden space-y-2">
              {!movLoading && movements.slice(0, 50).map((mov) => {
                const mat = materials.find((m) => m.id === mov.materialId);
                return (
                  <div key={mov.id} className="bg-white rounded-2xl border border-brand-100 shadow-card p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg ${MOVEMENT_BG[mov.type]}`}>
                        {MOVEMENT_ICON[mov.type]}
                        <span className={`text-xs font-semibold ${MOVEMENT_COLOR[mov.type]}`}>
                          {STOCK_MOVEMENT_TYPE_LABELS[mov.type]}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(mov.date)}</span>
                    </div>
                    <p className="text-sm font-medium mt-2">{mov.materialName ?? mat?.name ?? "—"}</p>
                    {mov.notes && <p className="text-xs text-muted-foreground">{mov.notes}</p>}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-50">
                      <span className={`text-sm font-bold ${MOVEMENT_COLOR[mov.type]}`}>
                        {mov.type === "usage" ? `-${mov.quantity}` : `+${mov.quantity}`} {mat ? MATERIAL_UNIT_LABELS[mat.unit] : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {mov.totalCostInCents > 0 ? formatCurrency(mov.totalCostInCents) : "—"}
                        </span>
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 w-7 p-0 text-red-300 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteMovement(mov.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!movLoading && movements.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhuma movimentação</p>
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-50">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Data</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Tipo</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Material</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Qtd</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Valor</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    {!movLoading && movements.slice(0, 50).map((mov) => {
                      const mat = materials.find((m) => m.id === mov.materialId);
                      return (
                        <tr key={mov.id} className="hover:bg-brand-50/50 transition-colors">
                          <td className="px-5 py-3 text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(mov.date)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {MOVEMENT_ICON[mov.type]}
                              <span className={`text-sm font-medium ${MOVEMENT_COLOR[mov.type]}`}>
                                {STOCK_MOVEMENT_TYPE_LABELS[mov.type]}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {mov.materialName ?? mat?.name ?? "—"}
                            {mov.notes && <p className="text-xs text-muted-foreground">{mov.notes}</p>}
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold">
                            {mov.type === "usage" ? `-${mov.quantity}` : `+${mov.quantity}`}
                          </td>
                          <td className="px-5 py-3 text-right text-sm font-semibold">
                            {mov.totalCostInCents > 0 ? formatCurrency(mov.totalCostInCents) : "—"}
                          </td>
                          <td className="px-2 py-3">
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 w-7 p-0 text-red-300 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteMovement(mov.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {!movLoading && movements.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                          Nenhuma movimentação registrada
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Purchases Tab ── */}
        {tab === "purchases" && (
          <div className="space-y-3">
            {purchasesLoading ? (
              <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma compra de material registrada</p>
                <p className="text-xs text-muted-foreground mt-1">Crie uma compra em Despesas → Material</p>
              </div>
            ) : (
              purchases.map((p) => {
                const isExpanded = purchaseExpanded === p.expense.id;
                const subtotal = p.linkedMaterials.reduce((sum, item) => sum + item.totalCostInCents, 0);
                const totalExpense = p.expense.installmentTotal && p.expense.installmentTotal > 1
                  ? p.expense.amountInCents * p.expense.installmentTotal
                  : p.expense.amountInCents;
                return (
                  <div key={p.expense.id} className={`bg-white rounded-2xl border shadow-card overflow-hidden transition-all ${
                    p.expense.isPaid ? "border-emerald-100" : "border-amber-100"
                  }`}>
                    <button
                      onClick={() => setPurchaseExpanded(isExpanded ? null : p.expense.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50/50 transition-colors text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        p.expense.isPaid ? "bg-emerald-50" : "bg-amber-50"
                      }`}>
                        <ShoppingCart className={`w-4 h-4 ${p.expense.isPaid ? "text-emerald-600" : "text-amber-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.expense.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {p.expense.isPaid ? (
                            <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Pago
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">Pendente</span>
                          )}
                          {p.expense.installmentTotal && p.expense.installmentTotal > 1 && (
                            <span className="font-semibold text-brand-600">
                              {p.expense.installmentCurrent}/{p.expense.installmentTotal}x
                            </span>
                          )}
                          <span>{p.linkedMaterials.length} ite{p.linkedMaterials.length !== 1 ? "ns" : "m"}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold">{formatCurrency(totalExpense)}</p>
                        {p.expense.installmentTotal && p.expense.installmentTotal > 1 && (
                          <p className="text-[10px] text-muted-foreground">{p.expense.installmentTotal}x {formatCurrency(p.expense.amountInCents)}</p>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-brand-50 px-4 py-3 space-y-3">
                        {/* Detalhes financeiros */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-brand-50/50 rounded-lg p-2">
                            <p className="text-muted-foreground">Valor total</p>
                            <p className="font-semibold">{formatCurrency(totalExpense)}</p>
                          </div>
                          {p.expense.installmentTotal && p.expense.installmentTotal > 1 && (
                            <div className="bg-brand-50/50 rounded-lg p-2">
                              <p className="text-muted-foreground">Parcela</p>
                              <p className="font-semibold">{formatCurrency(p.expense.amountInCents)} ({p.expense.installmentCurrent}/{p.expense.installmentTotal})</p>
                            </div>
                          )}
                        </div>

                        {/* Itens da compra */}
                        {p.linkedMaterials.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">Itens da compra</p>
                            {p.linkedMaterials.map((item, i) => (
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
                            {p.linkedMaterials.length > 1 && (
                              <div className="flex items-center justify-between text-xs pt-1.5 mt-1.5 border-t border-dashed border-brand-100">
                                <span className="text-muted-foreground">Subtotal itens</span>
                                <span className="font-semibold text-brand-700">{formatCurrency(subtotal)}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Nenhum material vinculado ainda.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Modal: Novo Material ── */}
      <Dialog open={matOpen} onOpenChange={setMatOpen}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-700">
              <Plus className="w-4 h-4" /> Novo Material
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nome *</Label>
              <Input
                value={matForm.name}
                onChange={(e) => setMatForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Cola para Cílios, Pinça Reta..."
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={matForm.category} onValueChange={(v) => setMatForm((f) => ({ ...f, category: v as MaterialCategory }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{MATERIAL_CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade</Label>
                <Select value={matForm.unit} onValueChange={(v) => setMatForm((f) => ({ ...f, unit: v as MaterialUnit }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{MATERIAL_UNIT_LABELS[u]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Custo unitário é gerenciado nas movimentações de compra */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estoque Inicial</Label>
                <Input
                  type="number"
                  value={matForm.initialStock}
                  onChange={(e) => setMatForm((f) => ({ ...f, initialStock: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Alerta (mín)</Label>
                <Input
                  type="number"
                  value={matForm.minimumStock}
                  onChange={(e) => setMatForm((f) => ({ ...f, minimumStock: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Input
                value={matForm.notes}
                onChange={(e) => setMatForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Observações opcionais"
                className="mt-1.5"
              />
            </div>
            <Button className="w-full h-11" onClick={handleCreateMaterial} disabled={saving}>
              <Plus className="w-4 h-4" />
              {saving ? "Cadastrando..." : "Cadastrar Material"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm((f) => ({ ...f, category: v as MaterialCategory }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{MATERIAL_CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade</Label>
                <Select value={editForm.unit} onValueChange={(v) => setEditForm((f) => ({ ...f, unit: v as MaterialUnit }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{MATERIAL_UNIT_LABELS[u]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Alerta (mín)</Label>
              <Input
                type="number"
                value={editForm.minimumStock}
                onChange={(e) => setEditForm((f) => ({ ...f, minimumStock: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Observações opcionais"
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setEditMat(null)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleUpdateMaterial} disabled={saving || !editForm.name.trim()}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Registrar Movimento ── */}
      <Dialog open={movOpen} onOpenChange={setMovOpen}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-700">
              <ShoppingCart className="w-4 h-4" /> Registrar Movimento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Material *</Label>
              <Select value={movForm.materialId} onValueChange={(v) => setMovForm((f) => ({ ...f, materialId: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione o material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} · estoque: {m.currentStock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={movForm.type} onValueChange={(v) => setMovForm((f) => ({ ...f, type: v as StockMovementType }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Compra (+)</SelectItem>
                    <SelectItem value="usage">Uso (-)</SelectItem>
                    <SelectItem value="adjustment">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number" min="1"
                  value={movForm.quantity}
                  onChange={(e) => setMovForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            {movForm.type === "purchase" && (() => {
              const selectedMat = materials.find((m) => m.id === movForm.materialId);
              const unitLabel = selectedMat ? MATERIAL_UNIT_LABELS[selectedMat.unit] : "unidade";
              const qty = parseInt(movForm.quantity) || 1;
              const unitPrice = parseFloat(movForm.unitPrice || "0");
              const totalCalc = unitPrice * qty;
              return (
                <>
                <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 space-y-2">
                  <p className="text-xs font-semibold text-brand-700 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" /> Valor da compra
                  </p>
                  <div>
                    <Label className="text-xs">Valor por {unitLabel} (R$)</Label>
                    <Input
                      type="number" step="0.01"
                      value={movForm.unitPrice}
                      onChange={(e) => setMovForm((f) => ({ ...f, unitPrice: e.target.value }))}
                      placeholder="Ex: 12,50"
                      className="mt-1 h-9 text-sm"
                    />
                  </div>
                  {totalCalc > 0 && (
                    <p className="text-xs font-medium text-brand-600">
                      Total: {formatCurrency(Math.round(totalCalc * 100))} ({qty}x {formatCurrency(Math.round(unitPrice * 100))})
                    </p>
                  )}
                </div>
                {/* Link to material expense */}
                {materialExpenses.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Vincular a compra de material</Label>
                    <Select value={movForm.expenseId} onValueChange={(v) => setMovForm((f) => ({ ...f, expenseId: v === "none" ? "" : v }))}>
                      <SelectTrigger className="mt-1.5 h-9 text-sm">
                        <SelectValue placeholder="Nenhuma (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {materialExpenses.map((exp) => {
                          const totalValue = exp.installmentTotal && exp.installmentTotal > 1
                            ? exp.amountInCents * exp.installmentTotal
                            : exp.amountInCents;
                          return (
                            <SelectItem key={exp.id} value={exp.id}>
                              {exp.name} · {formatCurrency(totalValue)}
                              {exp.installmentTotal && exp.installmentTotal > 1 ? ` (${exp.installmentTotal}x)` : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                </>
              );
            })()}
            <div>
              <Label>Observações</Label>
              <Input
                value={movForm.notes}
                onChange={(e) => setMovForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Ex: Compra na Shopee, reposição mensal..."
                className="mt-1.5"
              />
            </div>
            <Button className="w-full h-11" onClick={handleCreateMovement} disabled={saving}>
              {movForm.type === "purchase" ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              {saving ? "Registrando..." : `Registrar ${STOCK_MOVEMENT_TYPE_LABELS[movForm.type]}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
