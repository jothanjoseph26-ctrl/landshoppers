-- Align ServiceHub provider geography index naming with the PostGIS verifier.
-- Earlier ServiceHub migration created this as service_providers_geom_idx.
DO $$
BEGIN
  IF to_regclass('public.service_providers_geom_gix') IS NULL THEN
    IF to_regclass('public.service_providers_geom_idx') IS NOT NULL THEN
      ALTER INDEX "service_providers_geom_idx" RENAME TO "service_providers_geom_gix";
    ELSE
      CREATE INDEX "service_providers_geom_gix" ON "service_providers" USING GIST ("geom");
    END IF;
  END IF;
END $$;
