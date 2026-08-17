# ---- Base ----
FROM node:20-alpine AS base
RUN apk add --no-cache dumb-init openssl
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts

# ---- Prisma Generate ----
FROM deps AS prisma
COPY prisma ./prisma/
RUN npx prisma generate

# ---- Build ----
FROM prisma AS build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/
RUN npm run build
RUN npm prune --production

# ---- Production ----
FROM base AS production
ENV NODE_ENV=production

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=build --chown=appuser:appgroup /app/package.json ./

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["dumb-init", "node", "dist/src/main.js"]
