// client/src/lib/queryClient.ts
import { QueryClient, type QueryFunction } from "@tanstack/react-query";

/**
 * Throw an Error with helpful text if response not ok
 */
async function throwIfResNotOk(res: Response) {
  if (res.ok) return;

  const contentType = res.headers.get("content-type") ?? "";
  let bodyText: string | object;

  try {
    bodyText = contentType.includes("application/json") ? await res.json() : await res.text();
  } catch {
    bodyText = res.statusText;
  }

  // Prefer 'message' field from JSON if present
  if (typeof bodyText === "object" && bodyText !== null && "message" in (bodyText as any)) {
    throw new Error(String((bodyText as any).message));
  }

  throw new Error(`${res.status} - ${String(bodyText)}`);
}

/**
 * Generic apiRequest helper
 * - returns parsed JSON (or text if not JSON)
 * - sets credentials to "include" so cookies are always sent
 */
export async function apiRequest<T = any>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD",
  url: string,
  data?: unknown
): Promise<T> {
  const isFormData = data instanceof FormData;

  const headers: Record<string, string> = {};
  const init: RequestInit = {
    method,
    credentials: "include",
    headers,
  };

  if (method !== "GET" && method !== "HEAD" && data !== undefined) {
    if (isFormData) {
      init.body = data as FormData;
      // Do not set Content-Type; browser will handle it
    } else {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(data);
    }
  }

  const res = await fetch(url, init);

  await throwIfResNotOk(res);

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  const text = await res.text();
  return text as unknown as T;
}

/**
 * Create a query function for React Query that:
 * - uses queryKey[0] as URL
 * - includes credentials
 * - optionally returns null on 401
 */
type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn =
  <T = any>({ on401 }: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const first = Array.isArray(queryKey) ? queryKey[0] : queryKey;
    const url = String(first);

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (res.status === 401 && on401 === "returnNull") {
      return null as unknown as T;
    }

    await throwIfResNotOk(res);

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await res.json()) as T;
    }

    const text = await res.text();
    return text as unknown as T;
  };

/**
 * Default queryClient
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
