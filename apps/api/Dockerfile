# DigiHouse API — staging/production image
# Multi-stage: dependencies → runner
# Uses tsx at runtime (no compile step — tsconfig noEmit: true)

ARG NODE_VERSION=24.14.1-slim
FROM node:${NODE_VERSION} AS deps

WORKDIR /app

# Copy workspace root manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install all workspace deps (tsx is a devDep of @digihouse/api)
RUN npm ci --no-audit --no-fund --include-workspace-root

FROM node:${NODE_VERSION} AS runner
WORKDIR /app

# Copy node_modules (with workspace links intact)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/apps/api/package.json ./apps/api/package.json
COPY --from=deps /app/packages/shared/package.json ./packages/shared/package.json

# Copy source code
COPY apps/api/src ./apps/api/src
COPY apps/api/drizzle ./apps/api/drizzle
COPY packages/shared/src ./packages/shared/src

ENV NODE_ENV=production
EXPOSE 8787

CMD ["node_modules/.bin/tsx", "apps/api/src/index.ts"]
