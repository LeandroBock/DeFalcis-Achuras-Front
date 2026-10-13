import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, request, setUnauthorizedHandler } from "../http";

function mockFetch(status, body) {
  const text =
    body === undefined
      ? ""
      : typeof body === "string"
        ? body
        : JSON.stringify(body);

  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(text),
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

beforeEach(() => {
  const store = { access_token: "abc" };

  vi.stubGlobal("localStorage", {
    getItem: (key) => store[key] ?? null,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(null);
});

describe("request", () => {
  it("manda el token y arma la URL con los filtros no vacíos", async () => {
    const fetchMock = mockFetch(200, [{ id: 1 }]);

    const data = await request("/reports/payables", {
      query: { from: "2026-01-01", to: "" },
    });

    expect(data).toEqual([{ id: 1 }]);

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe("http://api.test/reports/payables?from=2026-01-01");
    expect(options.headers.Authorization).toBe("Bearer abc");
  });

  it("serializa el body como JSON", async () => {
    const fetchMock = mockFetch(201, { id: 2 });

    await request("/customers", { method: "POST", body: { name: "Ana" } });

    const [, options] = fetchMock.mock.calls[0];

    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.body).toBe('{"name":"Ana"}');
  });

  it("no rompe con respuestas vacías (204)", async () => {
    mockFetch(204);

    await expect(
      request("/expenses/1", { method: "DELETE" }),
    ).resolves.toBeNull();
  });

  it("usa el mensaje del backend, también si viene como lista", async () => {
    mockFetch(400, { message: ["nombre requerido", "email inválido"] });

    await expect(request("/customers")).rejects.toThrow(
      "nombre requerido, email inválido",
    );
  });

  it("usa el mensaje por defecto si el error no es JSON (ej: 502 en HTML)", async () => {
    mockFetch(502, "<html>Bad Gateway</html>");

    const error = await request("/orders", {
      errorMessage: "No se pudieron obtener las ventas",
    }).catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.message).toBe("No se pudieron obtener las ventas");
  });

  it("un 401 cierra la sesión", async () => {
    mockFetch(401, { message: "Unauthorized" });

    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    await expect(request("/orders")).rejects.toThrow("Tu sesión venció");
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("un 401 en un endpoint público (login) no cierra la sesión", async () => {
    mockFetch(401, { message: "Credenciales inválidas" });

    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    await expect(
      request("/auth/login", { method: "POST", body: {}, auth: false }),
    ).rejects.toThrow("Credenciales inválidas");
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("avisa cuando no hay conexión", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(request("/orders")).rejects.toThrow(
      "No se pudo conectar con el servidor",
    );
  });
});
