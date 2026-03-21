import type { Appointment, Payment } from "@/domain/entities";
import type { Procedure } from "@/domain/entities";
import { LASH_SERVICE_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/domain/enums";
import { formatCurrency, formatDate, formatDuration, formatTime } from "./formatters";

interface ReceiptUser {
  salonName?: string | null;
  salonAddress?: string | null;
}

function row(label: string, value: string, color = "#374151"): string {
  return `
    <tr>
      <td style="padding:5px 0;color:#6b7280;font-size:13px;width:44%">${label}</td>
      <td style="padding:5px 0;font-size:13px;font-weight:500;color:${color};text-align:right">${value}</td>
    </tr>`;
}

function section(title: string, content: string): string {
  return `
    <div style="margin-bottom:20px">
      <p style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin:0 0 8px">${title}</p>
      <table style="width:100%;border-collapse:collapse">${content}</table>
    </div>`;
}

function divider(): string {
  return `<div style="border-top:1px dashed #e5e7eb;margin:16px 0"></div>`;
}

export function openPdfReceipt(
  apt: Appointment,
  payment: Payment | null,
  user: ReceiptUser | null,
  procedures: Procedure[]
): void {
  const subtotal = payment?.subtotalAmountInCents ?? apt.priceCharged;
  const fees = payment?.feeAmountInCents ?? 0;
  const discounts = payment?.discountAmountInCents ?? 0;
  const total = payment?.paidAmountInCents ?? apt.priceCharged;

  // Build procedure rows from junction data or legacy fallback
  let procSection: string;

  if (apt.procedures && apt.procedures.length > 0) {
    // New path: individual procedure rows with correct prices
    const procRows = apt.procedures
      .map((p) => `
        <tr>
          <td style="padding:5px 0;font-size:13px;color:#374151;width:60%">${p.procedureName}</td>
          <td style="padding:5px 0;font-size:12px;color:#9ca3af;text-align:center">${formatDuration(p.durationMinutes)}</td>
          <td style="padding:5px 0;text-align:right">
            <span style="color:#059669;font-weight:600">${formatCurrency(p.effectivePriceInCents)}</span>
          </td>
        </tr>`)
      .join("");

    const isMulti = apt.procedures.length > 1;
    const totalRow = isMulti
      ? `<tr>
          <td colspan="2" style="padding:8px 0 4px;border-top:1px solid #f3f4f6;font-size:13px;font-weight:600;color:#374151">Total</td>
          <td style="padding:8px 0 4px;border-top:1px solid #f3f4f6;text-align:right;font-size:14px;font-weight:700;color:#059669">${formatCurrency(apt.priceCharged)}</td>
        </tr>`
      : "";

    procSection = `
      <div style="margin-bottom:20px">
        <p style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin:0 0 8px">Procedimento${isMulti ? "s" : ""}</p>
        <table style="width:100%;border-collapse:collapse">
          ${procRows}
          ${totalRow}
        </table>
        <p style="font-size:12px;color:#9ca3af;margin-top:6px">⏱ ${formatDuration(apt.durationMinutes)}</p>
      </div>`;
  } else {
    // Legacy fallback
    const primaryProc = procedures.find((p) => p.id === apt.procedureId);
    const procNames = apt.procedureName
      ? apt.procedureName.split(" + ")
      : primaryProc
      ? [primaryProc.name]
      : ["—"];

    const procRows = procNames
      .map((name) => `
        <tr>
          <td style="padding:5px 0;font-size:13px;color:#374151;width:70%">${name}</td>
          <td style="padding:5px 0;text-align:right">
            ${procNames.length === 1 ? `<span style="color:#059669;font-weight:600">${formatCurrency(apt.priceCharged)}</span>` : ""}
          </td>
        </tr>`)
      .join("");

    procSection = `
      <div style="margin-bottom:20px">
        <p style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin:0 0 8px">Procedimento${procNames.length > 1 ? "s" : ""}</p>
        <table style="width:100%;border-collapse:collapse">
          ${procRows}
          <tr>
            <td style="padding:4px 0;font-size:12px;color:#9ca3af">⏱ ${formatDuration(apt.durationMinutes)}</td>
            ${procNames.length > 1 ? `<td style="text-align:right;font-size:13px;font-weight:600;color:#059669">${formatCurrency(apt.priceCharged)}</td>` : "<td></td>"}
          </tr>
        </table>
      </div>`;
  }

  const financialRows = [
    subtotal !== total || fees > 0 || discounts > 0
      ? row("Subtotal", formatCurrency(subtotal))
      : "",
    fees > 0 ? row("Taxas / extras", `+ ${formatCurrency(fees)}`, "#d97706") : "",
    discounts > 0 ? row("Descontos", `− ${formatCurrency(discounts)}`, "#dc2626") : "",
    `<tr><td colspan="2" style="padding-top:8px;border-top:1px solid #e5e7eb"></td></tr>`,
    `<tr>
      <td style="padding:4px 0;font-size:15px;font-weight:700;color:#111827">Total</td>
      <td style="padding:4px 0;font-size:15px;font-weight:700;color:#059669;text-align:right">${formatCurrency(total)}</td>
    </tr>`,
    payment?.method
      ? row("Forma de pagamento", PAYMENT_METHOD_LABELS[payment.method])
      : "",
    payment?.paidAt
      ? row("Pago em", formatDate(payment.paidAt))
      : "",
  ]
    .filter(Boolean)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Extrato — ${apt.clientName ?? "Atendimento"}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: #f9fafb;
      display: flex;
      justify-content: center;
      padding: 40px 16px;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 420px;
      padding: 32px 28px;
      box-shadow: 0 4px 24px rgba(0,0,0,.08);
    }
    @media print {
      body { background: white; padding: 0; }
      .card { box-shadow: none; border-radius: 0; padding: 24px; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
<div class="card">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:24px">
    <h1 style="font-size:20px;font-weight:700;color:#111827;letter-spacing:-.01em">
      ${user?.salonName ?? "LashFlow"}
    </h1>
    ${user?.salonAddress ? `<p style="font-size:12px;color:#9ca3af;margin-top:4px">${user.salonAddress}</p>` : ""}
    <div style="margin:16px auto 0;width:40px;height:3px;background:linear-gradient(90deg,#a855f7,#ec4899);border-radius:999px"></div>
  </div>

  <!-- Badge -->
  <div style="text-align:center;margin-bottom:20px">
    <span style="display:inline-block;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:600;padding:4px 12px;border-radius:999px;border:1px solid #bbf7d0">
      ✓ Extrato de Atendimento
    </span>
  </div>

  ${divider()}

  <!-- Cliente -->
  ${section(
    "Cliente",
    row("Nome", apt.clientName ?? "—") +
      (apt.clientPhone ? row("Telefone", apt.clientPhone) : "")
  )}

  ${divider()}

  <!-- Atendimento -->
  ${section(
    "Atendimento",
    row("Data", formatDate(apt.scheduledAt)) +
      row("Horário", `${formatTime(apt.scheduledAt)} — ${formatTime(apt.endsAt)}`) +
      row("Duração", formatDuration(apt.durationMinutes)) +
      (apt.serviceType ? row("Tipo", LASH_SERVICE_TYPE_LABELS[apt.serviceType]) : "")
  )}

  ${divider()}

  <!-- Procedimentos -->
  ${procSection}

  ${divider()}

  <!-- Financeiro -->
  ${section("Valores", financialRows)}

  ${apt.notes ? `${divider()}<div style="margin-bottom:16px"><p style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:6px">Observações</p><p style="font-size:13px;color:#374151;line-height:1.5">${apt.notes}</p></div>` : ""}

  ${divider()}

  <!-- Footer -->
  <div style="text-align:center;padding-top:8px">
    <p style="font-size:13px;color:#6b7280">Obrigada pela preferência! 💜</p>
    <p style="font-size:10px;color:#d1d5db;margin-top:6px">gerado por LashFlow</p>
  </div>

  <!-- Print button -->
  <div class="no-print" style="margin-top:24px">
    <button onclick="window.print()" style="width:100%;height:44px;background:#7c3aed;color:white;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:.01em">
      Salvar / Imprimir PDF
    </button>
  </div>

</div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=520,height=800");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
