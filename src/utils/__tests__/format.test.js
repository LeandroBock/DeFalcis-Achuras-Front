import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatMoney,
  formatPaymentMethod,
  formatPurchaseStatus,
  multiplyMoney,
  normalizeText,
  roundMoney,
  sumMoney,
} from "../format";

// Intl usa un espacio duro entre "$" y el número
const clean = (text) => text.replace(/\s/g, " ");

describe("formatMoney", () => {
  it("formatea en pesos argentinos", () => {
    expect(clean(formatMoney(1234.5))).toBe("$ 1.234,50");
  });

  it("acepta strings numéricos (como vienen de la API)", () => {
    expect(clean(formatMoney("1500"))).toBe("$ 1.500,00");
  });

  it("muestra $ 0,00 en vez de $ NaN para valores inválidos", () => {
    expect(clean(formatMoney(undefined))).toBe("$ 0,00");
    expect(clean(formatMoney("abc"))).toBe("$ 0,00");
  });
});

describe("plata sin errores de float", () => {
  it("roundMoney redondea a 2 decimales", () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney("10.456")).toBe(10.46);
    expect(roundMoney("")).toBe(0);
  });

  it("sumMoney evita 0.1 + 0.2 = 0.30000000000000004", () => {
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
    expect(sumMoney(["1500.10", 2000.2, "0.3"])).toBe(3500.6);
    expect(sumMoney([])).toBe(0);
  });

  it("multiplyMoney calcula subtotales redondeados", () => {
    expect(multiplyMoney(3, 0.1)).toBe(0.3);
    expect(multiplyMoney("2.5", "1234.56")).toBe(3086.4);
  });
});

describe("etiquetas", () => {
  it("traduce valores conocidos", () => {
    expect(formatPaymentMethod("mercado_pago")).toBe("Mercado Pago");
    expect(formatPaymentMethod("current_account")).toBe("Cuenta corriente");
    expect(formatPurchaseStatus("CANCELLED")).toBe("Anulada");
  });

  it("devuelve el valor original si no lo conoce y '-' si está vacío", () => {
    expect(formatPaymentMethod("crypto")).toBe("crypto");
    expect(formatPaymentMethod(null)).toBe("-");
  });
});

describe("formatDate", () => {
  it("devuelve '-' para fechas vacías o inválidas", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate("no es fecha")).toBe("-");
  });
});

describe("normalizeText", () => {
  it("ignora mayúsculas y tildes", () => {
    expect(normalizeText("Categorías")).toBe(normalizeText("categorias"));
  });
});
