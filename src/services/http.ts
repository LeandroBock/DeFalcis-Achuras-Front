const API_URL = import.meta.env.VITE_API_URL;

export const TOKEN_KEY = "access_token";

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** false para endpoints públicos (ej: login): un 401 no cierra la sesión */
  auth?: boolean;
  /** Mensaje si el backend no manda uno propio */
  errorMessage?: string;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// AuthProvider registra acá qué hacer cuando el backend responde 401
// (token vencido o inválido): normalmente, cerrar la sesión.
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

interface ErrorBody {
  message?: string | string[];
  error?: { message?: string };
}

// El backend devuelve el mensaje en distintos formatos según el caso:
// { message: "..." }, { message: ["...", "..."] } o { error: { message } }
export function extractErrorMessage(data: unknown, fallback: string): string {
  const body = (
    typeof data === "object" && data !== null ? data : {}
  ) as ErrorBody;
  const message = body.error?.message || body.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || fallback;
}

// Lee el cuerpo sin romper si viene vacío (204) o no es JSON (ej: HTML de un 502)
async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const params = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const search = params.toString();

  return `${API_URL}${path}${search ? `?${search}` : ""}`;
}

async function send(
  path: string,
  { method = "GET", body, query, auth = true }: RequestOptions,
): Promise<Response> {
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    return await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Revisá tu conexión.",
      0,
    );
  }
}

async function handleError(
  response: Response,
  { auth = true, errorMessage }: RequestOptions,
): Promise<never> {
  const data = await parseBody(response);

  if (response.status === 401 && auth) {
    unauthorizedHandler?.();

    throw new ApiError("Tu sesión venció. Volvé a iniciar sesión.", 401, data);
  }

  throw new ApiError(
    extractErrorMessage(data, errorMessage || "Ocurrió un error inesperado"),
    response.status,
    data,
  );
}

/**
 * Hace una llamada al backend y devuelve el JSON de la respuesta.
 *
 * request("/customers", { errorMessage: "No se pudieron obtener los clientes" })
 * request("/customers", { method: "POST", body: customer })
 * request("/reports/payables", { query: { from, to } })
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- api.js todavía es JS
export async function request<T = any>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await send(path, options);

  if (!response.ok) {
    await handleError(response, options);
  }

  return parseBody(response) as Promise<T>;
}

// Descarga un archivo (Excel, PDF) devuelto por el backend
export async function download(
  path: string,
  filename: string,
  options: RequestOptions = {},
): Promise<void> {
  const response = await send(path, options);

  if (!response.ok) {
    await handleError(response, options);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}
