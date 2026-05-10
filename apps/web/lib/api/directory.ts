import { ApiRequestError } from './client'
import { apiFetchServer } from './server-fetch'
import type {
  ApiDeveloperDirectory,
  ApiListResponse,
  ApiProjectDetail,
} from './types'

export type ApiDeveloperDetail = ApiDeveloperDirectory & {
  projects: Array<{
    id: string
    name: string
    slug: string
    city: string
    state: string
    status: string
    propertyType: string
    thumbnail: string
  }>
}

export async function fetchDevelopersCatalog(opts?: {
  page?: number
  pageSize?: number
  q?: string
  city?: string
}): Promise<{ data: ApiDeveloperDirectory[]; meta: ApiListResponse<unknown>['meta'] }> {
  const params = new URLSearchParams()
  params.set('page', String(opts?.page ?? 1))
  params.set('pageSize', String(opts?.pageSize ?? 48))
  if (opts?.q) params.set('q', opts.q)
  if (opts?.city) params.set('city', opts.city)
  try {
    const res = await apiFetchServer<ApiListResponse<ApiDeveloperDirectory[]>>(
      `/v1/developers?${params}`,
      { next: { revalidate: 60 } },
    )
    return { data: res.data ?? [], meta: res.meta }
  } catch {
    return { data: [], meta: undefined }
  }
}

export async function fetchDeveloper(id: string): Promise<ApiDeveloperDetail | null> {
  try {
    const res = await apiFetchServer<{ data: ApiDeveloperDetail }>(
      `/v1/developers/${id}`,
      { next: { revalidate: 60 } },
    )
    return res.data
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) return null
    throw e
  }
}

export async function fetchProject(id: string): Promise<ApiProjectDetail | null> {
  try {
    const res = await apiFetchServer<{ data: ApiProjectDetail }>(
      `/v1/projects/${id}`,
      { next: { revalidate: 60 } },
    )
    return res.data
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) return null
    throw e
  }
}
