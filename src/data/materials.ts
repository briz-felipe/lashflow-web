import type { Material } from "@/domain/entities";
import type { StockMovement } from "@/domain/entities";
import type { MaterialCategory, MaterialUnit, StockMovementType } from "@/domain/enums";

function mat(
  id: string,
  name: string,
  category: MaterialCategory,
  unit: MaterialUnit,
  unitCostInCents: number,
  currentStock: number,
  minimumStock: number,
): Material {
  const now = new Date();
  return {
    id,
    name,
    category,
    unit,
    unitCostInCents,
    currentStock,
    minimumStock,
    isActive: true,
    createdAt: new Date(now.getTime() - 90 * 86400000),
    updatedAt: now,
  };
}

export const mockMaterials: Material[] = [
  // Essenciais
  mat("mat-001", "Fios Fadvan Volume Brasileiro (caixinha)", "essenciais", "caixa", 1690, 8, 3),
  mat("mat-002", "Cola para Cílios (variável)", "essenciais", "un", 6290, 2, 1),
  mat("mat-003", "Removedor de Cílios", "essenciais", "un", 2649, 3, 1),
  mat("mat-004", "Fio Elipse", "essenciais", "un", 2500, 4, 2),
  mat("mat-005", "Adesivo Extra (backup)", "essenciais", "un", 4500, 1, 1),
  mat("mat-006", "Primer", "essenciais", "un", 1800, 2, 1),

  // Acessórios
  mat("mat-007", "Pinça Reta (Nagaraku)", "acessorios", "par", 2999, 3, 2),
  mat("mat-008", "Pinça Curva Chauffada (Santa Clara)", "acessorios", "un", 8000, 2, 1),
  mat("mat-009", "Pinça Ponta Agulha", "acessorios", "un", 8000, 1, 1),
  mat("mat-010", "Almotolia (pump espumador)", "acessorios", "un", 1500, 1, 1),
  mat("mat-011", "Caneta Marcadora", "acessorios", "un", 800, 2, 1),
  mat("mat-012", "Pedra Jade", "acessorios", "un", 1200, 1, 1),
  mat("mat-013", "Espelho de Dentista", "acessorios", "un", 2000, 1, 1),
  mat("mat-014", "Pincel para Higienização", "acessorios", "un", 500, 2, 1),
  mat("mat-015", "Tesourinha Ponta Reta", "acessorios", "un", 4000, 1, 1),
  mat("mat-016", "Suporte Acrílico", "acessorios", "un", 1029, 1, 1),
  mat("mat-017", "Medidor de Temperatura", "acessorios", "un", 2120, 1, 1),
  mat("mat-018", "Umidificador de Ar", "acessorios", "un", 1399, 1, 1),

  // Descartáveis
  mat("mat-019", "Escovinhas (pacote 50un)", "descartaveis", "pacote", 500, 6, 3),
  mat("mat-020", "Microbrush (pacote 100un)", "descartaveis", "pacote", 800, 4, 2),
  mat("mat-021", "Gel Pads (pacote 10 pares)", "descartaveis", "pacote", 1500, 5, 2),
  mat("mat-022", "Touca Descartável (pacote 100un)", "descartaveis", "pacote", 1200, 2, 1),
  mat("mat-023", "Micropore", "descartaveis", "rolo", 500, 4, 2),
  mat("mat-024", "Cotonete (pacote 100un)", "descartaveis", "pacote", 1500, 3, 1),
  mat("mat-025", "Papel Toalha (pacote)", "descartaveis", "pacote", 2500, 2, 1),
  mat("mat-026", "Luvas Descartáveis (pacote 100un)", "descartaveis", "pacote", 2000, 3, 1),
  mat("mat-027", "Máscaras Descartáveis (pacote)", "descartaveis", "pacote", 4000, 2, 1),
  mat("mat-028", "Anel Descartável (100un)", "descartaveis", "pacote", 1099, 3, 1),
  mat("mat-029", "Aplicador Gloss (pacote 50un)", "descartaveis", "pacote", 1000, 2, 1),

  // Químicos
  mat("mat-030", "Água Micelar Loreal", "quimicos", "un", 2799, 2, 1),
  mat("mat-031", "Potinho Pump Up", "quimicos", "un", 690, 3, 1),
  mat("mat-032", "Finalizador Cherry", "quimicos", "un", 4890, 1, 1),
  mat("mat-033", "Bruma Navina + Nano Mister", "quimicos", "kit", 3650, 1, 1),
  mat("mat-034", "Frasco Difusor Água", "quimicos", "un", 1199, 2, 1),
  mat("mat-035", "Detergente Enzimático 1L", "quimicos", "un", 3000, 1, 1),
  mat("mat-036", "Álcool 70 para Higienização", "quimicos", "un", 3000, 1, 1),

  // Opcionais
  mat("mat-037", "Ventilador de Mão", "opcionais", "un", 2000, 1, 0),
  mat("mat-038", "Navalha Elétrica / Mini Navalha", "opcionais", "un", 4000, 1, 0),
  mat("mat-039", "Higrômetro", "opcionais", "un", 3500, 1, 0),

  // Kit consumíveis (Dapen, henna etc.)
  mat("mat-040", "Algodão em Disco (pacote)", "descartaveis", "pacote", 7000, 2, 1),
  mat("mat-041", "Adstringente 500ml Depil Bella", "quimicos", "un", 2000, 1, 1),
  mat("mat-042", "Esfoliante Depil Bella", "quimicos", "un", 1800, 1, 1),
  mat("mat-043", "Gel Calmante Camomila DepilBella", "quimicos", "un", 1800, 1, 1),
  mat("mat-044", "Borrifador de Água", "acessorios", "un", 2500, 1, 1),
  mat("mat-045", "Linha para Design", "essenciais", "un", 1000, 3, 1),
  mat("mat-046", "Lápis Dermatográfico Preto", "essenciais", "un", 10000, 2, 1),
  mat("mat-047", "Caneta em Gel Branca", "essenciais", "un", 1500, 2, 1),
  mat("mat-048", "Henna cor 3 (Castanho escuro/Marrom)", "essenciais", "un", 900, 3, 1),
  mat("mat-049", "Dapen para Henna (kit com 10un)", "descartaveis", "kit", 4000, 1, 1),
  mat("mat-050", "Palito de Baranjera (pacote 100un)", "descartaveis", "pacote", 1000, 2, 1),
  mat("mat-051", "Mixer para Misturar Henna", "acessorios", "un", 5000, 1, 1),
  mat("mat-052", "Paquímetro", "acessorios", "un", 4500, 1, 1),
  mat("mat-053", "2 Fitas Transpore", "descartaveis", "rolo", 890, 4, 2),

  // Blocos / fichas
  mat("mat-054", "Bloco Ficha Anamnese Design de Sobrancelhas", "descartaveis", "un", 1500, 2, 1),
  mat("mat-055", "1 Pinça Tradicional Descartável (Merheje)", "descartaveis", "pacote", 8500, 1, 1),
];

// Stock movements (recent purchases and usage)
function mov(
  id: string,
  materialId: string,
  type: StockMovementType,
  quantity: number,
  unitCostInCents: number,
  daysAgo: number,
  notes?: string,
): StockMovement {
  const now = new Date();
  const date = new Date(now.getTime() - daysAgo * 86400000);
  return {
    id,
    materialId,
    type,
    quantity,
    unitCostInCents,
    totalCostInCents: quantity * unitCostInCents,
    date,
    notes,
    createdAt: date,
  };
}

export const mockStockMovements: StockMovement[] = [
  // Recent purchases
  mov("mov-001", "mat-001", "purchase", 5, 1690, 30, "Reposição Fadvan"),
  mov("mov-002", "mat-002", "purchase", 2, 6290, 25, "Cola nova"),
  mov("mov-003", "mat-019", "purchase", 3, 500, 20, "Escovinhas"),
  mov("mov-004", "mat-020", "purchase", 2, 800, 20, "Microbrush"),
  mov("mov-005", "mat-021", "purchase", 3, 1500, 15, "Gel pads"),
  mov("mov-006", "mat-030", "purchase", 1, 2799, 10, "Água micelar"),
  mov("mov-007", "mat-026", "purchase", 2, 2000, 8, "Luvas"),
  mov("mov-008", "mat-003", "purchase", 1, 2649, 5, "Removedor extra"),

  // Recent usage
  mov("mov-009", "mat-001", "usage", 2, 1690, 28),
  mov("mov-010", "mat-002", "usage", 1, 6290, 22),
  mov("mov-011", "mat-019", "usage", 2, 500, 18),
  mov("mov-012", "mat-020", "usage", 1, 800, 15),
  mov("mov-013", "mat-021", "usage", 2, 1500, 12),
  mov("mov-014", "mat-023", "usage", 1, 500, 10),
  mov("mov-015", "mat-024", "usage", 1, 1500, 7),
  mov("mov-016", "mat-025", "usage", 1, 2500, 5),

  // Older purchases
  mov("mov-017", "mat-007", "purchase", 2, 2999, 60, "Pinças Nagaraku"),
  mov("mov-018", "mat-008", "purchase", 1, 8000, 60, "Pinça chauffada"),
  mov("mov-019", "mat-032", "purchase", 1, 4890, 45, "Finalizador"),
  mov("mov-020", "mat-033", "purchase", 1, 3650, 45, "Bruma + nano mister"),
  mov("mov-021", "mat-035", "purchase", 1, 3000, 40, "Detergente enzimático"),
  mov("mov-022", "mat-036", "purchase", 1, 3000, 40, "Álcool 70"),

  // Adjustments
  mov("mov-023", "mat-001", "adjustment", 1, 0, 14, "Contagem física"),

  // More recent purchases (this month)
  mov("mov-024", "mat-040", "purchase", 1, 7000, 3, "Algodão"),
  mov("mov-025", "mat-041", "purchase", 1, 2000, 3, "Adstringente"),
  mov("mov-026", "mat-048", "purchase", 2, 900, 2, "Henna castanho"),
  mov("mov-027", "mat-045", "purchase", 2, 1000, 1, "Linha design"),
];
