import { describe, expect, it } from "vitest";

import { isTokenExpired } from "../token";

function fakeJwt(payload) {
  const encode = (value) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  return `${encode({ alg: "HS256" })}.${encode(payload)}.firma`;
}

describe("isTokenExpired", () => {
  const now = Date.UTC(2026, 0, 1);
  const inSeconds = (offset) => Math.floor(now / 1000) + offset;

  it("sin token es vencido", () => {
    expect(isTokenExpired(null, now)).toBe(true);
    expect(isTokenExpired("", now)).toBe(true);
  });

  it("detecta tokens vencidos y vigentes", () => {
    expect(isTokenExpired(fakeJwt({ exp: inSeconds(-60) }), now)).toBe(true);
    expect(isTokenExpired(fakeJwt({ exp: inSeconds(3600) }), now)).toBe(false);
  });

  it("si no puede leerlo, lo deja pasar y decide el backend", () => {
    expect(isTokenExpired("token-opaco", now)).toBe(false);
    expect(isTokenExpired(fakeJwt({ sub: "123" }), now)).toBe(false);
  });
});
