import type { ApiAgentDetail, ApiAgentSummary, ApiListResponse } from "./types"
import { apiFetchServer } from "./server-fetch"

export async function fetchAgentsList(query: {
  page?: number
  pageSize?: number
  city?: string
  q?: string
}): Promise<ApiListResponse<ApiAgentSummary[]> | null> {
  const params = new URLSearchParams()
  params.set("page", String(query.page ?? 1))
  params.set("pageSize", String(query.pageSize ?? 100))
  if (query.city) params.set("city", query.city)
  if (query.q) params.set("q", query.q)
  try {
    return await apiFetchServer<ApiListResponse<ApiAgentSummary[]>>(
      `/v1/agents?${params}`,
      { next: { revalidate: 30 } },
    )
  } catch {
    return null
  }
}

export async function fetchAgentDetail(
  id: string,
): Promise<{ data: ApiAgentDetail } | null> {
  try {
    return await apiFetchServer<{ data: ApiAgentDetail }>(
      `/v1/agents/${id}`,
      { next: { revalidate: 30 } },
    )
  } catch {
    return null
  }
}
