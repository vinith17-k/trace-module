# Multi-stage Dockerfile for TRACE Government / SIH 2026 Production Deployment
# 100% Free & Open Source, Self-Hostable on NIC / MeghRaj / On-Premise Linux VM

# Stage 1: Dependencies & Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies needed for node-gyp if any native modules are present
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

COPY . .

# Build standalone self-contained Node.js server
ENV NITRO_PRESET=node-server
RUN npm run build:node

# Stage 2: Production Minimal Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8082

# Create non-root user for cybersecurity compliance
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 traceuser

# Copy built server output and public static assets
COPY --from=builder --chown=traceuser:nodejs /app/.output ./.output

USER traceuser

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8082/ || exit 1

CMD ["node", ".output/server/index.mjs"]
