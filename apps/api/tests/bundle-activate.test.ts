import { describe, expect, it } from "vitest";

import { estimatedBundlePlatformFeeKobo } from "../src/lib/servicehub/bundle-activate.js";

describe("bundle-activate fee helpers (SHB-040 phase 1)", () => {
  it("500 BPS (5%) of bundle floor in kobo — bigint, no floats", () => {
    expect(estimatedBundlePlatformFeeKobo(100n)).toBe(5n);
    expect(estimatedBundlePlatformFeeKobo(350_000_00n)).toBe(17_500_00n);
  });
});
