"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { useStock, useStockMovements, useStockAlerts, useStockAnalytics } from "@/hooks/useStock";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/components/ui/toaster";
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  ShoppingCart,
  Minus,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wrench,
} from "lucide-react";
import type { MaterialCategory, MaterialUnit, StockMovementType } from "@/domain/enums";
import {
  MATERIAL_CATEGORY_LABELS,
  MATERIAL_UNIT_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
} from "@/domain/enums";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORIES: MaterialCategory[] = ["essenciais", "acessorios", "descartaveis", "quimicos", "opcionais"];
const UNITS: MaterialUnit[] = ["un", "pacote", "caixa", "ml", "g", "par", "rolo", "kit"];

const MOVEMENT_ICON: Record<StockMovementType, React.ReactNode> = {
  purchase: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />,
  usage: <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />,
  adjustment: <Wrench className="w-3.5 h-3.5 text-amber-500" />,
};

const MOVEMENT_COLOR: Record<StockMovementType, string> = {
  purchase: "text-emerald-600",
  usage: "text-red-500",
  adjustment: "text-amber-600",
};

type Tab = "materials" | "movements" | "new-material" | "new-movement";

export default function EstoquePage() {
  const [tab, setTab] = useState<Tab>("materials");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<MaterialCategory | "all">("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const { materials, loading, createMaterial, createMovement } = useStock({
    search: search || undefined,
    category: catFilter !== "all" ? catFilter : undefined,
    lowStock: lowStockOnly || undefined,
  });
  const { movements, loading: movLoading } = useStockMovements();
  const { alerts } = useStockAlerts();
  const { monthlyCosts, totalValue, loading: analyticsLoading } = useStockAnalytics();

  // New material form
  const [matForm, setMatForm] = useState({
    name: "", category: "essenciais" as MaterialCategory, unit: "un" as MaterialUnit,
    unitCostInCents: "", minimumStock: "1", initialStock: "0", notes: "",
  });

  // New movement form
  const [movForm, setMovForm] = useState({
    materialId: "", type: "purchase" as StockMovementType,
    quantity: "1", unitCostInCents: "",
    notes: "",
  });

  const handleCreateMaterial = async () => {
    if (!matForm.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    await createMaterial({
      name: matForm.name,
      category: matForm.category,
      unit: matForm.unit,
      unitCostInCents: Math.round(parseFloat(matForm.unitCostInCents || "0") * 100),
      minimumStock: parseInt(matForm.minimumStock) || 1,
      initialStock: parseInt(matForm.initialStock) || 0,
      notes: matForm.notes || undefined,
    });
    toast({ title: "Material cadastrado!", variant: "success" });
    setMatForm({ name: "", category: "essenciais", unit: "un", unitCostInCents: "", minimumStock: "1", initialStock: "0", notes: "" });
    setTab("materials");
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
    const cost = movForm.type === "purchase"
      ? Math.round(parseFloat(movForm.unitCostInCents || "0") * 100)
      : materials.find((m) => m.id === movForm.materialId)?.unitCostInCents ?? 0;

    await createMovement({
      materialId: movForm.materialId,
      type: movForm.type,
      quantity: qty,
      unitCostInCents: cost,
      notes: movForm.notes || undefined,
    });
    toast({ title: `${STOCK_MOVEMENT_TYPE_LABELS[movForm.type]} registrada!`, variant: "success" });
    setMovForm({ materialId: "", type: "purchase", quantity: "1", unitCostInCents: "", notes: "" });
    setTab("movements");
  };

  if (loading && analyticsLoading) return <LoadingPage />;

  const thisMonthCost = monthlyCosts.length > 0 ? monthlyCosts[monthlyCosts.length - 1].totalCostInCents : 0;

  return (
    <div>
      <Topbar title="Estoque" subtitle="Controle de materiais e insumos" />

      <div className="p-4 sm:p-6 animate-fade-in space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title="Materiais Ativos"
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
            title="Compras no Mês"
            value={formatCurrency(thisMonthCost)}
            icon={<ShoppingCart className="w-5 h-5" />}
            color="amber"
          />
        </div>

        {/* Low stock alerts */}
        {alerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">Estoque Baixo — {alerts.length} {alerts.length === 1 ? "item" : "itens"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {alerts.map((a) => (
                <span key={a.materialId} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                  {a.materialName} ({a.currentStock}/{a.minimumStock})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "materials" as Tab, label: "Materiais", icon: Package },
            { key: "movements" as Tab, label: "Movimentações", icon: TrendingDown },
            { key: "new-material" as Tab, label: "Novo Material", icon: Plus },
            { key: "new-movement" as Tab, label: "Registrar Movimento", icon: ShoppingCart },
          ].map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.key)}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </Button>
          ))}
        </div>

        {/* Materials list */}
        {tab === "materials" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar material..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={catFilter} onValueChange={(v) => setCatFilter(v as MaterialCategory | "all")}>
                <SelectTrigger className="w-[180px]">
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
                className="h-10"
              >
                <AlertTriangle className="w-4 h-4" />
                Estoque Baixo
              </Button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-50">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">Material</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden sm:table-cell">Categoria</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Estoque</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Mínimo</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Custo Unit.</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-3">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    {materials.map((mat) => {
                      const isLow = mat.currentStock <= mat.minimumStock;
                      return (
                        <tr key={mat.id} className="hover:bg-brand-50/50 transition-colors">
                          <td className="px-6 py-3">
                            <p className="text-sm font-medium">{mat.name}</p>
                            <p className="text-xs text-muted-foreground">{MATERIAL_UNIT_LABELS[mat.unit]}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
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
                          <td className="px-6 py-3 text-right">
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

        {/* Movements list */}
        {tab === "movements" && (
          <div className="bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-brand-50">
              <h3 className="font-semibold">Movimentações Recentes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-50">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">Data</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Tipo</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Material</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Qtd</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-3">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {!movLoading && movements.slice(0, 50).map((mov) => {
                    const mat = materials.find((m) => m.id === mov.materialId);
                    return (
                      <tr key={mov.id} className="hover:bg-brand-50/50 transition-colors">
                        <td className="px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {format(mov.date, "dd/MM/yyyy", { locale: ptBR })}
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
                          {mat?.name ?? mov.materialId}
                          {mov.notes && <p className="text-xs text-muted-foreground">{mov.notes}</p>}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold">
                          {mov.type === "usage" ? `-${mov.quantity}` : `+${mov.quantity}`}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-semibold">
                          {mov.totalCostInCents > 0 ? formatCurrency(mov.totalCostInCents) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* New Material Form */}
        {tab === "new-material" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
              <h3 className="font-semibold mb-5 flex items-center gap-2 text-brand-700 text-base">
                <Plus className="w-4 h-4" /> Novo Material
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={matForm.name}
                    onChange={(e) => setMatForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Cola para Cílios, Pinça Reta..."
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Nome do produto como você conhece</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <p className="text-xs text-muted-foreground mt-1">Agrupa materiais similares</p>
                  </div>
                  <div>
                    <Label>Unidade de Medida</Label>
                    <Select value={matForm.unit} onValueChange={(v) => setMatForm((f) => ({ ...f, unit: v as MaterialUnit }))}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>{MATERIAL_UNIT_LABELS[u]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Como você compra (un, pacote, caixa...)</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Custo Unit. (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={matForm.unitCostInCents}
                      onChange={(e) => setMatForm((f) => ({ ...f, unitCostInCents: e.target.value }))}
                      placeholder="0,00"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Preço pago por unidade</p>
                  </div>
                  <div>
                    <Label>Estoque Inicial</Label>
                    <Input
                      type="number"
                      value={matForm.initialStock}
                      onChange={(e) => setMatForm((f) => ({ ...f, initialStock: e.target.value }))}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Quantidade em mãos agora</p>
                  </div>
                  <div>
                    <Label>Alerta de Estoque</Label>
                    <Input
                      type="number"
                      value={matForm.minimumStock}
                      onChange={(e) => setMatForm((f) => ({ ...f, minimumStock: e.target.value }))}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Avisa quando chegar nessa qtd</p>
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input
                    value={matForm.notes}
                    onChange={(e) => setMatForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Observações sobre o material"
                    className="mt-1.5"
                  />
                </div>
                <Button className="w-full h-11" onClick={handleCreateMaterial}>
                  <Plus className="w-4 h-4" /> Cadastrar Material
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* New Movement Form */}
        {tab === "new-movement" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-6 sm:p-8">
              <h3 className="font-semibold mb-5 flex items-center gap-2 text-brand-700 text-base">
                <ShoppingCart className="w-4 h-4" /> Registrar Movimento
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Material *</Label>
                  <Select value={movForm.materialId} onValueChange={(v) => setMovForm((f) => ({ ...f, materialId: v }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione o material" /></SelectTrigger>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name} (estoque: {m.currentStock})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Qual material vai registrar</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>O que aconteceu?</Label>
                    <Select value={movForm.type} onValueChange={(v) => setMovForm((f) => ({ ...f, type: v as StockMovementType }))}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purchase">Compra (+)</SelectItem>
                        <SelectItem value="usage">Uso (-)</SelectItem>
                        <SelectItem value="adjustment">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {movForm.type === "purchase" ? "Comprou material novo" : movForm.type === "usage" ? "Usou no atendimento" : "Corrigir contagem do estoque"}
                    </p>
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={movForm.quantity}
                      onChange={(e) => setMovForm((f) => ({ ...f, quantity: e.target.value }))}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Quantas unidades</p>
                  </div>
                </div>
                {movForm.type === "purchase" && (
                  <div>
                    <Label>Custo Unitário (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={movForm.unitCostInCents}
                      onChange={(e) => setMovForm((f) => ({ ...f, unitCostInCents: e.target.value }))}
                      placeholder="0,00"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Quanto pagou por unidade nessa compra</p>
                  </div>
                )}
                <div>
                  <Label>Observações</Label>
                  <Input
                    value={movForm.notes}
                    onChange={(e) => setMovForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Ex: Compra na Shopee, reposição mensal..."
                    className="mt-1.5"
                  />
                </div>
                <Button className="w-full h-11" onClick={handleCreateMovement}>
                  {movForm.type === "purchase" ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  Registrar {STOCK_MOVEMENT_TYPE_LABELS[movForm.type]}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
