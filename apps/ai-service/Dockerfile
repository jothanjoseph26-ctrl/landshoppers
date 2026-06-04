# AI service — FastAPI via uvicorn (Python) + pnpm workspace launcher
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ca-certificates \
  && ln -sf /usr/bin/python3 /usr/local/bin/python \
  && rm -rf /var/lib/apt/lists/*

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps ./apps
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/ai-service
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt \
  && python3 -m compileall -q app

WORKDIR /app
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1
ENV LANDSHOPPERS_PYTHON=python3
CMD ["pnpm", "--filter", "@landshoppers/ai-service", "start"]
