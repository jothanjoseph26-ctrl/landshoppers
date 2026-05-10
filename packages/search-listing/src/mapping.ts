/** OpenSearch 2.x index mapping for published listings (`landshoppers-listings-v1`). */
export const DEFAULT_LISTINGS_INDEX_NAME = "landshoppers-listings-v1";

/** Full PUT `/{index}` body: settings (normalizer + shard defaults) and mappings. */
export function listingSearchIndexCreateBody(): Record<string, unknown> {
  return {
    settings: {
      index: {
        number_of_shards: 1,
        number_of_replicas: 0,
      },
      analysis: {
        normalizer: {
          lowercase_normalizer: {
            type: "custom",
            filter: ["lowercase"],
          },
        },
      },
    },
    mappings: {
      properties: {
        listing_id: { type: "keyword" },
        property_slug: { type: "keyword" },
        title: {
          type: "text",
          fields: {
            keyword: { type: "keyword", ignore_above: 256 },
          },
        },
        description: { type: "text" },
        city: {
          type: "text",
          fields: {
            raw: { type: "keyword", normalizer: "lowercase_normalizer" },
          },
        },
        state: {
          type: "text",
          fields: {
            raw: { type: "keyword", normalizer: "lowercase_normalizer" },
          },
        },
        country: { type: "keyword" },
        property_type: { type: "keyword" },
        price: { type: "long" },
        bedrooms: { type: "integer" },
        bathrooms: { type: "integer" },
        is_for_sale: { type: "boolean" },
        is_for_rent: { type: "boolean" },
        verification_badge: { type: "boolean" },
        published_at: { type: "date" },
        created_at: { type: "date" },
        location: { type: "geo_point" },
        features: { type: "keyword" },
        suggest: { type: "completion" },
      },
    },
  };
}
