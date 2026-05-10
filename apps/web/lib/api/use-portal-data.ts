"use client"

import useSWR, { type SWRConfiguration } from "swr"

import { ApiRequestError } from "./client"
import { getAccessToken } from "./auth-session"

export type PortalQuery<T> = {
  data: T | undefined
  error: Error | undefined
  isLoading: boolean
  /** True when a token is missing — UIs render an auth-required state. */
  isUnauthenticated: boolean
  /** True when the API returned 401/403 (token may be expired or wrong role). */
  isForbidden: boolean
  refresh: () => void
}

/**
 * Wraps SWR with a uniform contract for portal pages: we surface auth-required
 * and forbidden states so portal UIs don't collapse into a generic error.
 */
export function usePortalData<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  config?: SWRConfiguration<T, Error>,
): PortalQuery<T> {
  const hasToken = typeof window === "undefined" ? false : Boolean(getAccessToken())
  const swrKey = hasToken && key ? key : null

  const { data, error, isLoading, mutate } = useSWR<T, Error>(swrKey, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    ...config,
  })

  const isForbidden =
    error instanceof ApiRequestError && (error.status === 401 || error.status === 403)

  return {
    data,
    error,
    isLoading,
    isUnauthenticated: !hasToken,
    isForbidden,
    refresh: () => {
      void mutate()
    },
  }
}
