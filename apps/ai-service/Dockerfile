# AI service — Node.js 20 + Python 3.12 for the pnpm build step (compileall).
# Deploy on Railway: set Dockerfile path to apps/ai-service/Dockerfile.
FROM node:20-slim

WORKDIR /app

# Install Python 3.12 required by scripts/python-module.mjs during build and runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.12 \
    python3.12-venv \
    python3-pip \
  && rm -rf /var/lib/apt/lists/*

# Make `python` resolve to python3.12 so the build script finds it.
RUN ln -sf /usr/bin/python3.12 /usr/local/bin/python

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps ./apps
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

# Install Python dependencies needed at runtime.
RUN pip install --no-cache-dir --break-system-packages -r apps/ai-service/requirements.txt

RUN pnpm --filter @landshoppers/ai-service build

ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1
CMD ["pnpm", "--filter", "@landshoppers/ai-service", "start"]
