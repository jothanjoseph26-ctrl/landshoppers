/** §SVC-PUB-01 city filter pills + §SVC-PUB-02 `/services/[category]/[geo]` directory SEO routes. */
export const SERVICE_DIRECTORY_GEO = {
  lagos: "Lagos",
  abuja: "Abuja",
  "port-harcourt": "Port Harcourt",
  ibadan: "Ibadan",
  kano: "Kano",
  enugu: "Enugu",
} as const

export type ServiceDirectoryGeoSlug = keyof typeof SERVICE_DIRECTORY_GEO

export function isServiceDirectoryGeoSlug(
  s: string,
): s is ServiceDirectoryGeoSlug {
  return s in SERVICE_DIRECTORY_GEO
}
