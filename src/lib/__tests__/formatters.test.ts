import { describe, it, expect } from "vitest";
import { formatDuration, parsePtBR, centsToInput, formatCurrency } from "../formatters";

describe("formatDuration", () => {
  it("mostra só minutos quando menor que 1 hora", () => {
    expect(formatDuration(45)).toBe("45min");
    expect(formatDuration(1)).toBe("1min");
  });

  it("mostra só horas quando múltiplo exato", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(120)).toBe("2h");
    expect(formatDuration(180)).toBe("3h");
  });

  it("mostra horas e minutos quando tem resto", () => {
    expect(formatDuration(90)).toBe("1h 30min");
    expect(formatDuration(75)).toBe("1h 15min");
    expect(formatDuration(150)).toBe("2h 30min");
  });

  it("trata zero corretamente", () => {
    expect(formatDuration(0)).toBe("0min");
  });
});

describe("parsePtBR", () => {
  it("converte string simples para centavos", () => {
    expect(parsePtBR("150,00")).toBe(15000);
    expect(parsePtBR("1,50")).toBe(150);
    expect(parsePtBR("0,99")).toBe(99);
  });

  it("trata separador de milhar corretamente", () => {
    expect(parsePtBR("1.500,00")).toBe(150000);
    expect(parsePtBR("1.500,50")).toBe(150050);
    expect(parsePtBR("10.000,00")).toBe(1000000);
  });

  it("trata string vazia ou zero", () => {
    expect(parsePtBR("")).toBe(0);
    expect(parsePtBR("0,00")).toBe(0);
  });

  it("trata input inválido sem quebrar", () => {
    expect(parsePtBR("abc")).toBe(0);
  });
});

describe("centsToInput", () => {
  it("formata centavos para string pt-BR", () => {
    expect(centsToInput(15000)).toBe("150,00");
    expect(centsToInput(150050)).toBe("1.500,50");
    expect(centsToInput(99)).toBe("0,99");
  });

  it("vai e volta: parsePtBR(centsToInput(x)) === x", () => {
    const values = [0, 99, 15000, 150050, 1000000];
    for (const v of values) {
      expect(parsePtBR(centsToInput(v))).toBe(v);
    }
  });
});

describe("formatCurrency", () => {
  it("formata para BRL com símbolo", () => {
    expect(formatCurrency(15000)).toContain("150");
    expect(formatCurrency(150050)).toContain("1.500");
  });
});
