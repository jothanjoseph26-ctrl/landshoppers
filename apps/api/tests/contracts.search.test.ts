import { describe, expect, it } from "vitest";

import { listingsSearchQuerySchema, mapSearchQuerySchema } from "../src/contracts/search.js";

describe("search query contracts", () => {
  it("listings search rejects partial geo params", () => {
    expect(() =>
      listingsSearchQuerySchema.parse({
        lat: "6",
      }),
    ).toThrow();
  });

  it("listings search accepts full radius geo set", () => {
    const r = listingsSearchQuerySchema.parse({
      lat: "6.45",
      lng: "3.42",
      radiusKm: "20",
      page: "1",
      pageSize: "10",
    });
    expect(r.lat).toBe(6.45);
    expect(r.backend).toBe("auto");
  });

  it("map search rejects invalid bbox", () => {
    expect(() =>
      mapSearchQuerySchema.parse({
        minLng: 3,
        minLat: 6,
        maxLng: 2,
        maxLat: 7,
      }),
    ).toThrow();
  });

  it("map search accepts bbox", () => {
    const r = mapSearchQuerySchema.parse({
      minLng: 3,
      minLat: 6,
      maxLng: 4,
      maxLat: 7,
      pageSize: "200",
    });
    expect(r.pageSize).toBe(200);
  });
});
