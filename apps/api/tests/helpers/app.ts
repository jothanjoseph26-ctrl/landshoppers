import { app } from "../../src/app.js";

type JsonInit = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
};

const BASE = "http://test.local";

/** Wraps `app.fetch` with JSON body/serialization helpers and an optional bearer token. */
export async function call<T = unknown>(
  path: string,
  init: JsonInit = {},
): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = {
    accept: "application/json",
    ...init.headers,
  };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (init.token) headers["authorization"] = `Bearer ${init.token}`;

  const res = await app.fetch(
    new Request(`${BASE}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    }),
  );
  const text = await res.text();
  let body: unknown = null;
  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, body: body as T };
}
