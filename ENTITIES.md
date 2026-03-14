# LashFlow — Especificação de Entidades, Regras e APIs

> Documento de referência para desenvolvimento do backend. Reflete fielmente o contrato já implementado no frontend.

---

## Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Modelo de Dados](#2-modelo-de-dados)
3. [Enums e Tipos](#3-enums-e-tipos)
4. [Regras de Negócio](#4-regras-de-negócio)
5. [APIs — Contratos de Endpoint](#5-apis--contratos-de-endpoint)
6. [Relacionamentos](#6-relacionamentos)
7. [Autenticação e Contexto](#7-autenticação-e-contexto)
8. [Observações de Implementação](#8-observações-de-implementação)

---

## 1. Visão Geral do Sistema

LashFlow é um sistema de gestão para profissionais de extensão de cílios. O core do negócio é o ciclo de tratamento:

```
Aplicação → Manutenção (a cada 15-21 dias) → Remoção / Nova Aplicação
```

### Módulos

| Módulo | Descrição |
|--------|-----------|
| **Agenda** | Agendamentos, slots disponíveis, aprovações |
| **Clientes** | Cadastro, segmentação, histórico |
| **Procedimentos** | Catálogo de serviços oferecidos |
| **Pagamentos** | Receita, cash flow, métodos |
| **Anamnese** | Ficha de saúde e preferências do cliente |
| **Estoque** | Materiais, movimentações, alertas |
| **Despesas** | Contas fixas/variáveis, parcelamentos |
| **Agendamento Público** | Fluxo self-service para clientes |

---

## 2. Modelo de Dados

### 2.1 Client

```typescript
interface Client {
  id: string                        // UUID
  name: string                      // obrigatório
  phone: string                     // obrigatório, único, formato BR: (XX) XXXXX-XXXX
  email?: string
  instagram?: string
  birthday?: string                 // formato: "YYYY-MM-DD"
  notes?: string
  address?: {
    street?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
  }
  segments: ClientSegment[]         // calculado ou editável, default: []
  favoriteProcedureId?: string      // FK → Procedure.id (procedimento mais agendado)
  totalSpent: number                // centavos, calculado via Payments
  appointmentsCount: number         // calculado via Appointments
  lastAppointmentDate?: Date        // calculado via Appointments
  createdAt: Date
  updatedAt: Date
}
```

**Campos calculados** (derivar via query ou atualizar por trigger):
- `totalSpent` → soma de `Payment.paidAmountInCents` onde `clientId = this.id`
- `appointmentsCount` → contagem de Appointments com status `completed`
- `lastAppointmentDate` → max `scheduledAt` de Appointments com status `completed`
- `favoriteProcedureId` → procedureId mais frequente em Appointments `completed`

---

### 2.2 Procedure

```typescript
interface Procedure {
  id: string
  name: string                      // obrigatório
  technique: LashTechnique          // obrigatório
  description?: string
  priceInCents: number              // obrigatório, > 0
  durationMinutes: number           // obrigatório, usado para calcular slots disponíveis
  isActive: boolean                 // default: true
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}
```

**Regra:** Procedures inativas não aparecem no agendamento público, mas agendamentos existentes não são afetados.

---

### 2.3 Appointment

```typescript
interface Appointment {
  id: string
  clientId: string                  // FK → Client.id
  procedureId: string               // FK → Procedure.id
  paymentId?: string                // FK → Payment.id (definido após pagamento)
  serviceType?: LashServiceType     // "application" | "maintenance" | "removal" | "lash_lifting" | "permanent"
  status: AppointmentStatus
  scheduledAt: Date                 // datetime completo com timezone
  durationMinutes: number           // copiado de Procedure.durationMinutes no momento do agendamento
  endsAt: Date                      // calculado: scheduledAt + durationMinutes
  priceCharged: number              // centavos, pode diferir de Procedure.priceInCents (desconto/ajuste)
  notes?: string
  requestedAt: Date                 // quando o cliente solicitou
  confirmedAt?: Date
  cancelledAt?: Date
  cancellationReason?: string
  cancelledBy?: "professional" | "client"
  createdAt: Date
  updatedAt: Date
}
```

**Transições de status válidas:**

```
pending_approval → confirmed → in_progress → completed
pending_approval → cancelled
confirmed        → cancelled
confirmed        → no_show
in_progress      → completed
in_progress      → cancelled
```

---

### 2.4 Payment

```typescript
interface Payment {
  id: string
  appointmentId: string             // FK → Appointment.id, único
  clientId: string                  // FK → Client.id
  totalAmountInCents: number        // valor total cobrado
  paidAmountInCents: number         // quanto foi pago (pode ser parcial)
  status: PaymentStatus             // "pending" | "paid" | "partial" | "refunded" | "failed"
  method?: PaymentMethod            // método principal (pode ser misto via partialPayments)
  paidAt?: Date
  partialPayments?: PartialPaymentRecord[]   // para pagamentos mistos (ex: parte pix + parte dinheiro)
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface PartialPaymentRecord {
  id: string
  amountInCents: number
  method: PaymentMethod
  paidAt: Date
}
```

**Regras:**
- Um Appointment tem no máximo um Payment
- `status = "paid"` quando `paidAmountInCents >= totalAmountInCents`
- `status = "partial"` quando `0 < paidAmountInCents < totalAmountInCents`
- `partialPayments` permite registrar múltiplos métodos de pagamento em uma mesma conta

---

### 2.5 Anamnesis

```typescript
interface Anamnesis {
  id: string
  clientId: string                  // FK → Client.id
  // Campos preventivos / saúde
  hasAllergy: boolean
  allergyDetails?: string           // preenchido se hasAllergy = true
  hadEyeSurgeryLast3Months: boolean
  hasEyeDisease: boolean
  eyeDiseaseDetails?: string
  usesEyeDrops: boolean
  familyThyroidHistory: boolean
  hasGlaucoma: boolean
  hairLossGrade?: AnamnesisHairLoss // "low" | "medium" | "high"
  proneToBlepharitis: boolean
  hasEpilepsy: boolean
  // Serviço
  procedureType: AnamnosisProcedureType   // "extension" | "permanent" | "lash_lifting"
  mapping?: LashMapping             // mapeamento personalizado dos cílios
  // Autorizações
  authorizedPhotoPublishing: boolean
  signedAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface LashMapping {
  size?: string                     // ex: "12mm", "13mm", "14mm"
  curve?: string                    // ex: "B", "C", "D", "L"
  thickness?: string                // ex: "0.07", "0.10", "0.15"
}
```

**Regras:**
- Um cliente pode ter múltiplas anamneses (histórico evolutivo)
- A anamnese mais recente é a vigente
- `allergyDetails` deve ser obrigatório quando `hasAllergy = true`

---

### 2.6 Material

```typescript
interface Material {
  id: string
  name: string                      // obrigatório, único
  category: MaterialCategory
  unit: MaterialUnit
  unitCostInCents: number           // custo por unidade em centavos
  currentStock: number              // quantidade atual (atualizado a cada StockMovement)
  minimumStock: number              // alerta de reposição quando currentStock <= minimumStock
  isActive: boolean                 // default: true
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

---

### 2.7 StockMovement

```typescript
interface StockMovement {
  id: string
  materialId: string                // FK → Material.id
  type: StockMovementType           // "purchase" | "usage" | "adjustment"
  quantity: number                  // sempre positivo; direção definida pelo type
  unitCostInCents: number           // custo unitário no momento do movimento
  totalCostInCents: number          // calculado: quantity × unitCostInCents
  date: Date
  notes?: string
  createdAt: Date
}
```

**Efeito no estoque:**
- `purchase` → `Material.currentStock += quantity`
- `usage` → `Material.currentStock -= quantity`
- `adjustment` → `Material.currentStock = quantity` (valor absoluto do novo estoque)

---

### 2.8 Expense

```typescript
interface Expense {
  id: string
  name: string                      // obrigatório
  category: string                  // ExpenseCategory padrão ou string customizada
  amountInCents: number             // valor da parcela/ocorrência em centavos
  recurrence: ExpenseRecurrence     // "one_time" | "monthly" | "weekly" | "yearly"
  dueDay?: number                   // dia do mês para vencimento (1-31)
  isPaid: boolean                   // default: false
  paidAt?: Date
  referenceMonth: string            // formato: "YYYY-MM"
  notes?: string
  // Parcelamento
  installmentTotal?: number         // total de parcelas (ex: 6)
  installmentCurrent?: number       // parcela atual (ex: 1, 2, 3...)
  installmentGroupId?: string       // UUID que agrupa todas as parcelas de uma mesma compra
  createdAt: Date
  updatedAt: Date
}
```

**Regras de parcelamento:**
- Ao criar com `installments > 1`, o sistema gera N registros de Expense automaticamente
- Cada registro tem o mesmo `installmentGroupId`, valores sequenciais de `installmentCurrent`, e `referenceMonth` incrementado mês a mês
- `recurrence` é forçado para `"monthly"` em despesas parceladas
- Ao deletar uma parcela, deletar somente aquela (não o grupo inteiro)

---

### 2.9 TimeSlot e BlockedDate

```typescript
interface TimeSlot {
  id: string
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6   // 0 = domingo
  startTime: string                         // formato: "HH:MM"
  endTime: string                           // formato: "HH:MM"
  isAvailable: boolean
}

interface BlockedDate {
  id: string
  date: string                // formato: "YYYY-MM-DD"
  reason?: string
}
```

**Configuração padrão:**
- Segunda a Sexta: `09:00 – 18:00`
- Sábado: `09:00 – 14:00`
- Domingo: fechado (sem TimeSlot ou `isAvailable: false`)

---

## 3. Enums e Tipos

### ClientSegment
| Valor | Label | Critério sugerido |
|-------|-------|-------------------|
| `volume` | Volume | Técnica volume como mais usada |
| `classic` | Clássico | Técnica clássica como mais usada |
| `hybrid` | Híbrido | Técnica híbrida como mais usada |
| `vip` | VIP | ≥ 5 agendamentos ou ≥ R$ 1.000 gastos |
| `recorrente` | Recorrente | Manutenções regulares nos últimos 45 dias |
| `inativa` | Inativa | Sem agendamento há mais de 60 dias |

### AppointmentStatus
| Valor | Label | Transições permitidas |
|-------|-------|-----------------------|
| `pending_approval` | Aguardando Aprovação | → `confirmed`, `cancelled` |
| `confirmed` | Confirmado | → `in_progress`, `cancelled`, `no_show` |
| `in_progress` | Em Atendimento | → `completed`, `cancelled` |
| `completed` | Concluído | — (estado final) |
| `cancelled` | Cancelado | — (estado final) |
| `no_show` | Não Compareceu | — (estado final) |

### PaymentMethod
| Valor | Label |
|-------|-------|
| `cash` | Dinheiro |
| `credit_card` | Cartão de Crédito |
| `debit_card` | Cartão de Débito |
| `pix` | Pix |
| `bank_transfer` | Transferência |
| `other` | Outro |

### PaymentStatus
`pending` · `paid` · `partial` · `refunded` · `failed`

### LashTechnique
| Valor | Label |
|-------|-------|
| `classic` | Clássico |
| `volume` | Volume |
| `hybrid` | Híbrido |
| `mega_volume` | Mega Volume |
| `wispy` | Wispy |
| `wet_look` | Wet Look |
| `other` | Outro |

### LashServiceType
| Valor | Label |
|-------|-------|
| `application` | Aplicação |
| `maintenance` | Manutenção |
| `removal` | Remoção |
| `lash_lifting` | Lash Lifting |
| `permanent` | Permanente de Cílios |

### MaterialCategory
| Valor | Label |
|-------|-------|
| `essenciais` | Essenciais |
| `acessorios` | Acessórios |
| `descartaveis` | Descartáveis |
| `quimicos` | Químicos |
| `opcionais` | Opcionais |

### MaterialUnit
`un` · `pacote` · `caixa` · `ml` · `g` · `par` · `rolo` · `kit`

### StockMovementType
`purchase` · `usage` · `adjustment`

### ExpenseCategory (valores padrão)
`aluguel` · `energia` · `agua` · `internet` · `telefone` · `material` · `marketing` · `software` · `manutencao` · `transporte` · `alimentacao` · `impostos` · `outros`

> **Categorias customizadas:** O campo `category` em Expense aceita qualquer string — o frontend permite criar categorias personalizadas. No banco, o campo deve ser `VARCHAR` livre (não enum).

### ExpenseRecurrence
`one_time` · `monthly` · `weekly` · `yearly`

### AnamnesisHairLoss
`low` · `medium` · `high`

### AnamnosisProcedureType
`extension` · `permanent` · `lash_lifting`

---

## 4. Regras de Negócio

### 4.1 Disponibilidade de Agenda

```
1. Verificar se a data está em BlockedDates → retornar [] se sim
2. Buscar TimeSlot do dayOfWeek correspondente onde isAvailable = true
3. Se não houver TimeSlot → retornar []
4. Gerar slots de 30 em 30 minutos entre startTime e endTime
5. Para cada slot: verificar se slot_start + procedure.durationMinutes <= endTime
6. Excluir slots que conflitem com agendamentos existentes:
   - Conflito: slotStart < existing.endsAt AND slotEnd > existing.scheduledAt
   - Status "cancelled" e "no_show" NÃO bloqueiam slots
7. Não retornar slots no passado
```

### 4.2 Criação de Agendamento (Fluxo Público)

```
1. Cliente seleciona procedimento ativo
2. Sistema carrega slots disponíveis para a data escolhida
3. Cliente informa nome + telefone
4. Backend: buscar Client pelo phone (normalizado, apenas dígitos)
   → Encontrou: usar clientId existente
   → Não encontrou: criar novo Client com name + phone
5. Criar Appointment com status "pending_approval"
6. Profissional aprova → status "confirmed"
   Profissional rejeita → status "cancelled" (com cancellationReason)
```

### 4.3 Ciclo de Tratamento
- `application` — primeira aplicação ou reaplicação completa
- `maintenance` — manutenção dos fios existentes (15-21 dias após aplicação)
- `removal` — remoção completa antes de nova aplicação
- Não há validação obrigatória de sequência no backend (profissional define)

### 4.4 Pagamento

```
1. Criar Payment ao concluir (ou durante) o atendimento
2. totalAmountInCents = priceCharged do Appointment
3. Pagamento simples: informar method + paidAmountInCents
4. Pagamento misto: adicionar PartialPaymentRecords individuais
   → paidAmountInCents = soma dos partialPayments
5. Status calculado automaticamente:
   - paidAmountInCents = 0                          → "pending"
   - 0 < paidAmountInCents < totalAmountInCents      → "partial"
   - paidAmountInCents >= totalAmountInCents          → "paid"
6. Ao confirmar pagamento → atualizar Client.totalSpent
```

### 4.5 Movimentação de Estoque

```
1. Ao criar StockMovement:
   - purchase:    Material.currentStock += quantity
   - usage:       Material.currentStock -= quantity
                  (retornar erro 422 se currentStock - quantity < 0)
   - adjustment:  Material.currentStock = quantity (absoluto)
2. totalCostInCents = quantity × unitCostInCents (calculado no backend)
3. Alerta de baixo estoque: currentStock <= minimumStock após o movimento
```

### 4.6 Despesas com Parcelamento

```
1. Se installments > 1 na criação:
   a. Gerar novo installmentGroupId (UUID)
   b. Criar N registros de Expense onde N = installments
   c. Cada registro:
      - installmentGroupId: mesmo UUID
      - installmentTotal: N
      - installmentCurrent: 1, 2, 3, ..., N
      - referenceMonth: mês base + (i-1) meses
      - recurrence: forçado para "monthly"
      - amountInCents: mesmo valor para todas
2. DELETE /expenses/:id → remove apenas aquela parcela
3. PATCH /expenses/:id/pay → marca apenas aquela parcela como paga
```

### 4.7 Segmentação de Clientes (sugestão de cálculo)

```
vip:        appointmentsCount >= 5 OU totalSpent >= 100000
recorrente: lastAppointmentDate há menos de 45 dias E appointmentsCount >= 2
inativa:    lastAppointmentDate há mais de 60 dias (ou nunca teve agendamento concluído)
volume:     técnica mais usada em appointments completed = "volume" ou "mega_volume"
classic:    técnica mais usada = "classic"
hybrid:     técnica mais usada = "hybrid"

Observação: um cliente pode ter múltiplos segmentos simultaneamente
```

---

## 5. APIs — Contratos de Endpoint

> **Base URL:** `/api/v1`
> **Formato:** JSON
> **Valores monetários:** sempre em **centavos (integer)**
> **Datas:** ISO 8601 (`2024-03-15T09:00:00Z`)
> **Autenticação:** `Authorization: Bearer <jwt>` em todas as rotas exceto `/public/*`

---

### 5.1 Clients

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/clients` | Lista paginada com filtros |
| `GET` | `/clients/:id` | Detalhe + stats |
| `POST` | `/clients` | Criar cliente |
| `PUT` | `/clients/:id` | Atualizar |
| `DELETE` | `/clients/:id` | Soft delete |
| `GET` | `/clients/search?q=` | Busca rápida |

**GET /clients — Query Params:**
```
search      string     busca por nome, telefone, email
segments    string[]   ex: ?segments=vip&segments=recorrente
page        int        default: 1
perPage     int        default: 20, max: 100
```

**POST /clients — Body:**
```json
{
  "name": "Maria Silva",
  "phone": "11999990000",
  "email": "maria@email.com",
  "instagram": "@maria",
  "birthday": "1995-04-22",
  "notes": "Prefere volume russo",
  "address": {
    "street": "Rua das Flores, 123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01001000"
  }
}
```

---

### 5.2 Procedures

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/procedures` | Lista (`?activeOnly=true`) |
| `GET` | `/procedures/:id` | Detalhe |
| `POST` | `/procedures` | Criar |
| `PUT` | `/procedures/:id` | Atualizar |
| `DELETE` | `/procedures/:id` | Deletar |
| `PATCH` | `/procedures/:id/toggle` | Ativar/desativar |

---

### 5.3 Appointments

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/appointments` | Lista com filtros |
| `GET` | `/appointments/:id` | Detalhe |
| `POST` | `/appointments` | Criar |
| `PATCH` | `/appointments/:id/status` | Atualizar status |
| `PATCH` | `/appointments/:id/cancel` | Cancelar |
| `GET` | `/appointments/available-slots` | Slots disponíveis |
| `GET` | `/appointments/pending-approvals` | Aguardando aprovação |
| `GET` | `/appointments/today` | Agendamentos de hoje |

**GET /appointments — Query Params:**
```
clientId    string
status      string[]    ex: ?status=confirmed&status=in_progress
from        date        ISO 8601
to          date        ISO 8601
```

**GET /appointments/available-slots — Query Params:**
```
date        string      "YYYY-MM-DD"  (obrigatório)
procedureId string      UUID          (obrigatório)
```

**Response /available-slots:**
```json
{
  "slots": [
    "2024-03-15T09:00:00-03:00",
    "2024-03-15T09:30:00-03:00",
    "2024-03-15T11:00:00-03:00"
  ]
}
```

**POST /appointments — Body:**
```json
{
  "clientId": "uuid",
  "procedureId": "uuid",
  "scheduledAt": "2024-03-15T09:00:00-03:00",
  "serviceType": "application",
  "priceCharged": 25000,
  "notes": "Primeira vez"
}
```

**PATCH /appointments/:id/status — Body:**
```json
{ "status": "confirmed" }
```

**PATCH /appointments/:id/cancel — Body:**
```json
{
  "reason": "Cliente desmarcou",
  "cancelledBy": "client"
}
```

---

### 5.4 Payments

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/payments` | Lista (`?from=&to=`) |
| `GET` | `/payments/:id` | Detalhe |
| `GET` | `/payments/by-appointment/:appointmentId` | Por agendamento |
| `POST` | `/payments` | Criar |
| `PATCH` | `/payments/:id` | Atualizar / adicionar parcial |
| `GET` | `/payments/stats` | Estatísticas de receita |
| `GET` | `/payments/cash-flow` | Extrato (`?from=&to=`) |
| `GET` | `/payments/monthly-revenue` | Receita mensal (`?months=6`) |
| `GET` | `/payments/method-breakdown` | Por método (`?from=&to=`) |

**Response GET /payments/stats:**
```json
{
  "todayInCents": 75000,
  "thisWeekInCents": 320000,
  "thisMonthInCents": 1250000,
  "lastMonthInCents": 1100000,
  "growthPercent": 13.6
}
```

**Response GET /payments/monthly-revenue:**
```json
[
  { "month": "2024-01", "amountInCents": 980000 },
  { "month": "2024-02", "amountInCents": 1100000 },
  { "month": "2024-03", "amountInCents": 1250000 }
]
```

**Response GET /payments/method-breakdown:**
```json
{
  "pix": 580000,
  "credit_card": 320000,
  "cash": 150000,
  "debit_card": 200000,
  "bank_transfer": 0,
  "other": 0
}
```

**PATCH /payments/:id — Body (adicionar pagamento parcial):**
```json
{
  "partialPayment": {
    "amountInCents": 12000,
    "method": "pix"
  }
}
```

---

### 5.5 Anamneses

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/anamneses?clientId=` | Lista por cliente (mais recente primeiro) |
| `GET` | `/anamneses/:id` | Detalhe |
| `POST` | `/anamneses` | Criar |
| `PUT` | `/anamneses/:id` | Atualizar |

---

### 5.6 Stock — Materials

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/stock/materials` | Lista com filtros |
| `GET` | `/stock/materials/:id` | Detalhe |
| `POST` | `/stock/materials` | Criar |
| `PUT` | `/stock/materials/:id` | Atualizar |
| `DELETE` | `/stock/materials/:id` | Deletar (soft) |
| `GET` | `/stock/materials/alerts` | Abaixo do mínimo |
| `GET` | `/stock/value` | Valor total do estoque |
| `GET` | `/stock/monthly-costs` | Custos mensais (`?months=6`) |

**GET /stock/materials — Query Params:**
```
category    string      MaterialCategory
search      string      busca por nome
lowStock    boolean     apenas abaixo do mínimo
```

**Response GET /stock/value:**
```json
{ "totalValueInCents": 285000 }
```

---

### 5.7 Stock — Movements

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/stock/movements` | Lista (`?materialId=&from=&to=`) |
| `POST` | `/stock/movements` | Registrar movimentação |

**POST /stock/movements — Body:**
```json
{
  "materialId": "uuid",
  "type": "purchase",
  "quantity": 5,
  "unitCostInCents": 4990,
  "notes": "Compra fornecedor X"
}
```

---

### 5.8 Expenses

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/expenses` | Lista com filtros |
| `GET` | `/expenses/:id` | Detalhe |
| `POST` | `/expenses` | Criar (com suporte a installments) |
| `PUT` | `/expenses/:id` | Atualizar |
| `DELETE` | `/expenses/:id` | Deletar parcela |
| `PATCH` | `/expenses/:id/pay` | Marcar como paga |
| `GET` | `/expenses/summary` | Resumo do mês (`?month=YYYY-MM`) |
| `GET` | `/expenses/monthly-totals` | Totais mensais (`?months=6`) |

**GET /expenses — Query Params:**
```
month       string      "YYYY-MM"
category    string      ExpenseCategory ou string customizada
isPaid      boolean
```

**POST /expenses — Body:**
```json
{
  "name": "Cadeira Reclinável",
  "category": "material",
  "amountInCents": 25000,
  "recurrence": "monthly",
  "dueDay": 10,
  "referenceMonth": "2024-03",
  "notes": "Parcelado no cartão",
  "installments": 6
}
```

**Response POST /expenses (com parcelas):**
```json
{
  "expense": { "id": "uuid", "installmentCurrent": 1, "...": "..." },
  "installmentsCreated": 6,
  "installmentGroupId": "uuid"
}
```

**Response GET /expenses/summary:**
```json
{
  "month": "2024-03",
  "totalInCents": 350000,
  "paidInCents": 220000,
  "pendingInCents": 130000,
  "byCategory": {
    "aluguel": 150000,
    "energia": 45000,
    "internet": 10000
  }
}
```

---

### 5.9 Agendamento Público (sem autenticação)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/public/procedures` | Procedures ativas |
| `GET` | `/public/available-slots` | Slots (`?date=&procedureId=`) |
| `POST` | `/public/appointments` | Solicitar agendamento |

**POST /public/appointments — Body:**
```json
{
  "procedureId": "uuid",
  "scheduledAt": "2024-03-20T10:00:00-03:00",
  "client": {
    "name": "Ana Paula",
    "phone": "11988887777"
  },
  "notes": "Prefiro técnica natural"
}
```

**Lógica de vinculação de cliente:**
1. Normalizar `phone` (somente dígitos)
2. Buscar Client pelo phone normalizado
3. Se encontrar → usar `clientId` existente
4. Se não encontrar → criar novo Client com `name` e `phone`
5. Criar Appointment com `status: "pending_approval"`

---

### 5.10 Dashboard / Analytics

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/dashboard/stats` | Resumo geral |
| `GET` | `/dashboard/today` | Agendamentos de hoje + pendências |

**Response GET /dashboard/stats:**
```json
{
  "totalClients": 142,
  "clientsWithUpcomingAppointments": 18,
  "todayAppointmentsCount": 4,
  "revenueStats": {
    "todayInCents": 75000,
    "thisWeekInCents": 320000,
    "thisMonthInCents": 1250000,
    "lastMonthInCents": 1100000,
    "growthPercent": 13.6
  },
  "monthlyRevenue": [
    { "month": "2024-01", "amountInCents": 980000 },
    { "month": "2024-02", "amountInCents": 1100000 }
  ],
  "pendingApprovalsCount": 2
}
```

---

### 5.11 Configurações de Agenda

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/settings/time-slots` | Horários por dia da semana |
| `PUT` | `/settings/time-slots` | Atualizar horários |
| `GET` | `/settings/blocked-dates` | Datas bloqueadas |
| `POST` | `/settings/blocked-dates` | Bloquear data |
| `DELETE` | `/settings/blocked-dates/:id` | Desbloquear data |

---

## 6. Relacionamentos

```
Professional ──── [todas as entidades via professionalId] (single-tenant)

Client ──────────┬──── Appointment    (1:N)  clientId
                 ├──── Payment        (1:N)  clientId
                 └──── Anamnesis      (1:N)  clientId

Procedure ───────┬──── Appointment    (1:N)  procedureId
                 └──── Client.favoriteProcedureId (N:1 opcional)

Appointment ─────┬──── Payment        (1:1)  appointmentId (unique)
                 ├──── Client         (N:1)
                 └──── Procedure      (N:1)

Payment ─────────└──── PartialPaymentRecord (1:N) embedded / tabela separada

Material ────────└──── StockMovement  (1:N)  materialId

Expense ──── installmentGroupId ──── Expense[] (auto-relacionamento de grupo)
```

---

## 7. Autenticação e Contexto

O sistema é **single-tenant** — cada conta pertence a um único profissional. Toda entidade carrega implicitamente o `professionalId` do token JWT.

### Estratégia
- **JWT** via header `Authorization: Bearer <token>`
- Login com `email + senha`
- Token contém: `{ professionalId, email, iat, exp }`
- Todas as rotas exceto `/public/*` exigem autenticação
- O `professionalId` é **extraído do token** — nunca enviado no body

### Rotas públicas (sem autenticação)
```
GET  /public/procedures
GET  /public/available-slots
POST /public/appointments
```

### Campo implícito em todas as entidades
```
professionalId: string (UUID)   // FK do profissional dono dos dados
```

---

## 8. Observações de Implementação

### Valores Monetários
- **Sempre armazenar e trafegar em centavos (integer)**
- `priceInCents: 25000` = R$ 250,00
- Evita problemas de arredondamento com float

### Normalização de Telefone
- Armazenar somente dígitos: `"11999990000"` (não `"(11) 99999-0000"`)
- O frontend formata para exibição
- Usado como chave de busca no fluxo público

### Fuso Horário
- Armazenar datas em **UTC** no banco
- Frontend envia datas em ISO 8601 com offset (`-03:00`)
- Slots disponíveis devem respeitar o timezone do profissional na geração

### Paginação Padrão
```json
{
  "data": [...],
  "total": 142,
  "page": 1,
  "perPage": 20
}
```

### Erros Padrão
```json
{
  "error": "SLOT_UNAVAILABLE",
  "message": "Horário já ocupado",
  "statusCode": 409
}
```

| Código | Uso |
|--------|-----|
| `400` | Validação de input |
| `401` | Não autenticado |
| `403` | Sem permissão |
| `404` | Não encontrado |
| `409` | Conflito (slot ocupado, phone duplicado) |
| `422` | Regra de negócio violada |
| `500` | Erro interno |

### Soft Delete
| Entidade | Estratégia |
|----------|-----------|
| `Client` | Soft delete — preserva histórico |
| `Procedure` | `isActive: false` — não deletar |
| `Material` | `isActive: false` — não deletar |
| `Appointment` | Hard delete permitido |
| `Payment` | Hard delete permitido |
| `Expense` | Hard delete permitido (parcela individual) |
| `StockMovement` | Hard delete permitido |
| `Anamnesis` | Hard delete permitido |

### Índices Recomendados
```sql
-- Appointments
CREATE INDEX idx_appointments_clientId     ON appointments(clientId);
CREATE INDEX idx_appointments_scheduledAt  ON appointments(scheduledAt);
CREATE INDEX idx_appointments_status       ON appointments(status);
CREATE INDEX idx_appointments_professional ON appointments(professionalId, scheduledAt);

-- Payments
CREATE UNIQUE INDEX idx_payments_appointmentId ON payments(appointmentId);
CREATE INDEX idx_payments_clientId             ON payments(clientId);
CREATE INDEX idx_payments_paidAt               ON payments(paidAt);

-- Expenses
CREATE INDEX idx_expenses_referenceMonth       ON expenses(professionalId, referenceMonth);
CREATE INDEX idx_expenses_installmentGroupId   ON expenses(installmentGroupId);

-- StockMovements
CREATE INDEX idx_movements_materialId          ON stock_movements(materialId);
CREATE INDEX idx_movements_date                ON stock_movements(date);

-- Anamneses
CREATE INDEX idx_anamneses_clientId            ON anamneses(clientId);
```
