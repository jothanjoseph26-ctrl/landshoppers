-- PostGIS geography columns for radius/bbox queries (backfilled from latitude/longitude when present)

ALTER TABLE "properties"
ADD COLUMN "geom" geography(Point,4326);

CREATE INDEX "properties_geom_gix" ON "properties" USING GIST ("geom");

UPDATE "properties"
SET "geom" = ST_SetSRID(ST_MakePoint("longitude"::double precision, "latitude"::double precision), 4326)::geography
WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;

ALTER TABLE "developer_projects"
ADD COLUMN "geom" geography(Point,4326);

CREATE INDEX "developer_projects_geom_gix" ON "developer_projects" USING GIST ("geom");

UPDATE "developer_projects"
SET "geom" = ST_SetSRID(ST_MakePoint("longitude"::double precision, "latitude"::double precision), 4326)::geography
WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;
