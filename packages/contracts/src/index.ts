/**
 * Shared JSON shapes for LandShoppers HTTP APIs (`apps/api` and clients).
 * Matches NEXT_PHASE_REDFIN_CLASS_DEVELOPMENT_PLAN.md § API Contract Direction.
 */

export type ApiMeta = Record<string, unknown>;

/** Successful JSON body: `error` is explicitly null for discriminated narrowing. */
export interface ApiSuccessEnvelope<T, M extends ApiMeta = ApiMeta> {
  data: T;
  meta?: M;
  error: null;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiFailureEnvelope {
  data?: null;
  meta?: ApiMeta;
  error: ApiErrorBody;
}

export type ApiEnvelope<T, M extends ApiMeta = ApiMeta> = ApiSuccessEnvelope<T, M> | ApiFailureEnvelope;
