import type { PrismaClient } from "@landshoppers/db";
import { Prisma } from "@landshoppers/db";

export type ProviderCoord = { latitude: number; longitude: number };

/** WGS84 coordinates from PostGIS `geom` for directory map pins (SVC-PUB-02). */
export async function fetchProviderCoordsByIds(
  prisma: PrismaClient,
  ids: string[],
): Promise<Map<string, ProviderCoord>> {
  const out = new Map<string, ProviderCoord>();
  if (ids.length === 0) return out;

  const rows = await prisma.$queryRaw<Array<{ id: string; latitude: number; longitude: number }>>`
    SELECT id,
      ST_Y(geom::geometry) AS latitude,
      ST_X(geom::geometry) AS longitude
    FROM service_providers
    WHERE id IN (${Prisma.join(ids)})
      AND geom IS NOT NULL
  `;

  for (const row of rows) {
    out.set(row.id, { latitude: row.latitude, longitude: row.longitude });
  }
  return out;
}
