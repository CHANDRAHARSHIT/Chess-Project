/** Thin client for /api/admin/*. Same-origin, so the admin session cookie rides along. */

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function adminApi<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { method = "GET", body } = options;

  const response = await fetch(`/api/admin${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((payload) => payload?.message)
      .catch(() => null);
    throw new AdminApiError(message || `Request failed (${response.status})`, response.status);
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json();
  return payload.data as T;
}
