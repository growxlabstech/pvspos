type FetcherOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetcher<T>(url: string, options: FetcherOptions = {}): Promise<T> {
  const { method = 'GET', body, headers: customHeaders } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const config: RequestInit = {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(
      errorData?.error ?? `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(url: string) => fetcher<T>(url),
  post: <T>(url: string, body: unknown) => fetcher<T>(url, { method: 'POST', body }),
  put: <T>(url: string, body: unknown) => fetcher<T>(url, { method: 'PUT', body }),
  patch: <T>(url: string, body: unknown) => fetcher<T>(url, { method: 'PATCH', body }),
  delete: <T>(url: string) => fetcher<T>(url, { method: 'DELETE' }),
};
