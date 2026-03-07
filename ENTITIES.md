# LashFlow — Entidades e Schema do Banco de Dados

Este documento descreve as entidades do domínio e o schema SQL sugerido para o backend.

---

## Diagrama de Relacionamentos

```
clients ────────────── appointments ─────── procedures
   │                        │
   │                        │
   └──── client_segments    └──── payments ─── partial_payment_records
```

---

## Tabelas

### `clients`
```sql
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(150)  NOT NULL,
  phone         VARCHAR(20)   NOT NULL UNIQUE,
  email         VARCHAR(150)  UNIQUE,
  instagram     VARCHAR(80),
  birthday      DATE,
  notes         TEXT,
  -- Endereço
  street        VARCHAR(200),
  city          VARCHAR(100),
  state         CHAR(2),
  zip_code      VARCHAR(10),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_phone ON clients (phone);
CREATE INDEX idx_clients_name  ON clients (name);
```

### `procedures`
```sql
CREATE TYPE lash_technique AS ENUM (
  'classic', 'volume', 'hybrid', 'mega_volume', 'wispy', 'wet_look', 'other'
);

CREATE TABLE procedures (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(100) NOT NULL,
  technique        lash_technique NOT NULL,
  description      TEXT,
  price_cents      INTEGER      NOT NULL CHECK (price_cents > 0),
  duration_minutes SMALLINT     NOT NULL CHECK (duration_minutes > 0),
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  image_url        TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### `appointments`
```sql
CREATE TYPE appointment_status AS ENUM (
  'pending_approval', 'confirmed', 'in_progress',
  'completed', 'cancelled', 'no_show'
);

CREATE TABLE appointments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID         NOT NULL REFERENCES clients(id)    ON DELETE RESTRICT,
  procedure_id        UUID         NOT NULL REFERENCES procedures(id) ON DELETE RESTRICT,
  status              appointment_status NOT NULL DEFAULT 'pending_approval',
  scheduled_at        TIMESTAMPTZ  NOT NULL,
  duration_minutes    SMALLINT     NOT NULL,
  price_charged       INTEGER      NOT NULL CHECK (price_charged >= 0),
  notes               TEXT,
  -- Workflow timestamps
  requested_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  confirmed_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by        VARCHAR(20)  CHECK (cancelled_by IN ('professional','client')),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  -- Computed / derived
  ends_at             TIMESTAMPTZ GENERATED ALWAYS AS (scheduled_at + (duration_minutes || ' minutes')::INTERVAL) STORED
);

CREATE INDEX idx_appointments_client_id   ON appointments (client_id, scheduled_at DESC);
CREATE INDEX idx_appointments_status      ON appointments (status, scheduled_at);
CREATE INDEX idx_appointments_scheduled   ON appointments (scheduled_at);
```

### `payments`
```sql
CREATE TYPE payment_method AS ENUM (
  'cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'other'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'paid', 'partial', 'refunded', 'failed'
);

CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id        UUID         NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT UNIQUE,
  client_id             UUID         NOT NULL REFERENCES clients(id)      ON DELETE RESTRICT,
  total_amount_cents    INTEGER      NOT NULL CHECK (total_amount_cents >= 0),
  paid_amount_cents     INTEGER      NOT NULL DEFAULT 0 CHECK (paid_amount_cents >= 0),
  status                payment_status NOT NULL DEFAULT 'pending',
  method                payment_method,
  paid_at               TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_client_id ON payments (client_id, paid_at DESC);
CREATE INDEX idx_payments_status    ON payments (status, paid_at);
```

### `partial_payment_records`
```sql
CREATE TABLE partial_payment_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id    UUID         NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount_cents  INTEGER      NOT NULL CHECK (amount_cents > 0),
  method        payment_method NOT NULL,
  paid_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_partial_payment_records_payment_id ON partial_payment_records (payment_id);
```

### `time_slots`
```sql
CREATE TABLE time_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME     NOT NULL,
  end_time     TIME     NOT NULL CHECK (end_time > start_time),
  is_available BOOLEAN  NOT NULL DEFAULT TRUE
);
```

### `blocked_dates`
```sql
CREATE TABLE blocked_dates (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date    DATE         NOT NULL UNIQUE,
  reason  VARCHAR(200)
);
```

### `client_segments` (materializada/computada)
```sql
CREATE TYPE client_segment AS ENUM (
  'volume', 'classic', 'hybrid', 'vip', 'recorrente', 'inativa'
);

CREATE TABLE client_segments (
  client_id   UUID           NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  segment     client_segment NOT NULL,
  assigned_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  PRIMARY KEY (client_id, segment)
);
```

---

## Regras de Segmentação

| Segmento     | Critério |
|--------------|----------|
| `vip`        | `SUM(price_charged)` em appointments concluídos > R$500 |
| `recorrente` | ≥ 1 agendamento concluído por mês nos últimos 3 meses |
| `inativa`    | Último agendamento concluído há mais de 60 dias |
| `volume`     | Técnica com maior frequência em appointments = `volume` |
| `classic`    | Técnica com maior frequência em appointments = `classic` |
| `hybrid`     | Técnica com maior frequência em appointments = `hybrid` |

As segmentações são **computadas** e podem ser materializadas com um job periódico (ex: cron diário) ou recalculadas em tempo real via views.

```sql
-- View de estatísticas por cliente (para materializar segmentos)
CREATE VIEW client_stats AS
SELECT
  c.id,
  c.name,
  COALESCE(SUM(p.paid_amount_cents), 0) AS total_spent_cents,
  COUNT(DISTINCT a.id)                   AS appointments_count,
  MAX(a.scheduled_at)                    AS last_appointment_date,
  MODE() WITHIN GROUP (ORDER BY pr.technique) AS favorite_technique
FROM clients c
LEFT JOIN appointments a  ON a.client_id = c.id AND a.status = 'completed'
LEFT JOIN procedures pr   ON pr.id = a.procedure_id
LEFT JOIN payments p      ON p.appointment_id = a.id AND p.status = 'paid'
GROUP BY c.id, c.name;
```

---

## Valores Monetários

Todos os valores monetários são armazenados em **centavos (INTEGER)** para evitar erros de ponto flutuante.

| Valor real | Armazenado |
|-----------|-----------|
| R$ 180,00 | `18000` |
| R$ 250,00 | `25000` |
| R$ 32,50  | `3250` |

A conversão para exibição é feita exclusivamente na camada de apresentação via `src/lib/formatters.ts`.

---

## API Endpoints (Backend a implementar)

```
POST   /api/clientes                          Criar cliente
GET    /api/clientes?search=&segments=        Listar clientes
GET    /api/clientes/:id                      Buscar cliente
PUT    /api/clientes/:id                      Atualizar cliente
DELETE /api/clientes/:id                      Deletar cliente

POST   /api/agendamentos                      Criar agendamento
GET    /api/agendamentos?clientId=&status=    Listar agendamentos
GET    /api/agendamentos/:id                  Buscar agendamento
PATCH  /api/agendamentos/:id/status           Atualizar status
PATCH  /api/agendamentos/:id/cancel           Cancelar
GET    /api/agendamentos/slots?date=&proc=    Horários disponíveis
GET    /api/agendamentos/today                Agendamentos de hoje

GET    /api/procedimentos                     Listar procedimentos
POST   /api/procedimentos                     Criar procedimento
PUT    /api/procedimentos/:id                 Atualizar procedimento
PATCH  /api/procedimentos/:id/toggle          Ativar/desativar

POST   /api/pagamentos                        Criar pagamento
GET    /api/pagamentos                        Listar pagamentos
PUT    /api/pagamentos/:id                    Atualizar pagamento
GET    /api/pagamentos/stats                  Estatísticas de receita
GET    /api/pagamentos/monthly?months=        Receita mensal
GET    /api/pagamentos/cash-flow?from=&to=    Fluxo de caixa
GET    /api/pagamentos/breakdown?from=&to=    Breakdown por método
```

---

## Troca Mock → API Real

Para migrar do mock para API real, altere no arquivo `src/services/index.ts`:

```ts
// Antes (mock)
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false"; // true

// Para ativar API real, setar no .env.local:
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=https://sua-api.com
```

Todos os contratos de serviço estão definidos em `src/services/interfaces/` e as implementações de API stub em `src/services/api/`.
