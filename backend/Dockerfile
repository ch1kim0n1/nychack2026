# syntax=docker/dockerfile:1

# ---------- Stage 1: build ----------
# Install ALL deps (incl. dev), generate the Prisma client, and compile.
FROM node:24-slim AS builder

# OpenSSL is required by Prisma's query engine at generate/runtime.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first to leverage Docker layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Prisma schema + config are needed before `prisma generate`.
# prisma.config.ts requires DATABASE_URL to be defined even though `generate`
# does not connect to the database. Supply a throwaway value for the build.
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" \
  npx prisma generate

# Copy the rest of the source and build.
COPY . .
RUN npm run build:prod

# Strip dev dependencies so we copy only production node_modules forward.
# `prisma generate` already wrote the client into node_modules, and `npm prune`
# preserves it (the generated client lives under @prisma/client + .prisma).
RUN npm prune --omit=dev

# ---------- Stage 2: runtime ----------
FROM node:24-slim AS runner

# OpenSSL needed at runtime by the Prisma query engine.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

# Copy production artifacts. The Prisma client + engine live in node_modules:
#   - node_modules/.prisma (generated client + native query engine binary)
#   - node_modules/@prisma (runtime + CLI used for `migrate deploy`)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

# Run as the unprivileged user that ships with the node image.
USER node

EXPOSE 3001

# NOTE: Database migrations are NOT run in CMD. On Railway, run
#   `npx prisma migrate deploy`
# as a release/deploy step (or one-off shell) so a slow/failed migration does
# not block container start or restart loops. CMD only starts the server.
CMD ["node", "dist/main.js"]
