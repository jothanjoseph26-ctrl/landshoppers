# Next.js — standalone build for AWS ECS Fargate
# Build args (NEXT_PUBLIC_* are baked at compile time, not runtime)
#   NEXT_PUBLIC_API_URL     https://api.yourdomain.com
#   NEXT_PUBLIC_APP_URL     https://app.yourdomain.com
#   NEXT_PUBLIC_MAPBOX_TOKEN  pk.eyJ...
#   NEXT_PUBLIC_SALES_WHATSAPP  234...
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# ---- install all workspace deps ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps ./apps
COPY scripts ./scripts
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM deps AS builder
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ARG NEXT_PUBLIC_SALES_WHATSAPP
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_PUBLIC_SALES_WHATSAPP=$NEXT_PUBLIC_SALES_WHATSAPP
# Prisma generate needs a syntactically-valid URL at tooling time (no live DB required)
ENV DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/dummy?schema=public"
RUN pnpm --filter @landshoppers/db exec prisma generate
RUN pnpm turbo run build --filter=@landshoppers/web

# ---- production runner ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# standalone output includes only files needed to run
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static    ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public           ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
