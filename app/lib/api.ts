/** Tiny browser-side fetch helper. Throws Error(message) on non-2xx. */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export const apiGet = <T>(url: string) => request<T>(url);

export const apiPost = <T>(url: string, body?: unknown) =>
  request<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined });

export const apiPatch = <T>(url: string, body?: unknown) =>
  request<T>(url, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });

export const apiDelete = <T>(url: string) => request<T>(url, { method: "DELETE" });
