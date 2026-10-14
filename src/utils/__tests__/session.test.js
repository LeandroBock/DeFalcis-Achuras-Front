import { describe, expect, it } from "vitest";

import {
  IDLE_LIMIT_MS,
  formatRemaining,
  idleRemaining,
  tokenRemaining,
} from "../session";

const jwt = (payload) =>
  `x.${btoa(JSON.stringify(payload)).replace(/=+$/, "")}.y`;

describe("sesión", () => {
  const now = 1_800_000_000_000;

  it("cuenta 60 minutos desde la última actividad", () => {
    expect(idleRemaining(now, now)).toBe(IDLE_LIMIT_MS);
    expect(idleRemaining(now - 59 * 60_000, now)).toBe(60_000);
    expect(idleRemaining(now - 61 * 60_000, now)).toBeLessThan(0);
  });

  it("sin actividad registrada arranca el conteo completo", () => {
    expect(idleRemaining(null, now)).toBe(IDLE_LIMIT_MS);
  });

  it("calcula cuánto le queda al token", () => {
    const exp = Math.floor(now / 1000) + 300;

    expect(tokenRemaining(jwt({ exp }), now)).toBe(300_000);
    expect(tokenRemaining(jwt({ exp: exp - 600 }), now)).toBeLessThan(0);
    expect(tokenRemaining(null, now)).toBe(0);
    expect(tokenRemaining("no-es-un-jwt", now)).toBe(Infinity);
  });

  it("muestra el tiempo restante", () => {
    expect(formatRemaining(45_000)).toBe("45 s");
    expect(formatRemaining(4 * 60_000 + 1)).toBe("5 min");
    expect(formatRemaining(-1)).toBe("0 s");
  });
});
