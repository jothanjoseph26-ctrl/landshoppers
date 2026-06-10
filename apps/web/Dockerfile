# Next.js — standalone build for AWS ECS Fargate
FROM node:22-bookworm-slim AS base
WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps ./apps
COPY scripts ./scripts
RUN pnpm install --frozen-lockfile

FROM deps AS builder
ARG NEXT_PUBLIC_API_URL=https://api.landshoppersrealty.com.ng
ARG NEXT_PUBLIC_APP_URL=https://landshoppersrealty.com.ng
ARG NEXT_PUBLIC_MAPBOX_TOKEN=pk.placeholder
ARG NEXT_PUBLIC_SALES_WHATSAPP=2349125172692
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_PUBLIC_SALES_WHATSAPP=$NEXT_PUBLIC_SALES_WHATSAPP
ENV DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/dummy?schema=public"
ENV DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5432/dummy?schema=public"
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV DOCKER_BUILD=1
RUN pnpm --filter @landshoppers/db exec prisma generate \
  && pnpm --filter @landshoppers/web run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
