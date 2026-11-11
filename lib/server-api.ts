// Chamadas HTTP aos endpoints do próprio backend feitas por Server Components.
// No servidor não existe "endereço atual" como no navegador, então a URL
// completa (http://host/api/...) é montada a partir dos cabeçalhos da requisição.
import "server-only";

import { headers } from "next/headers";

import { requestApi, type ApiResult } from "@/lib/api-client";

export async function requestApiFromServer<T>(path: string): Promise<ApiResult<T>> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  // cache: "no-store" → os dados são sempre consultados no momento do acesso.
  return requestApi<T>(`${protocol}://${host}${path}`, { cache: "no-store" });
}
