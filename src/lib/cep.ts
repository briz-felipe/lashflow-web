export interface CepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function fetchCep(cep: string): Promise<CepAddress> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) throw new Error("CEP inválido");

  const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`);
  if (!res.ok) throw new Error("CEP não encontrado");

  const data = await res.json();
  return {
    street: data.street ?? "",
    neighborhood: data.neighborhood ?? "",
    city: data.city ?? "",
    state: data.state ?? "",
  };
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
}
