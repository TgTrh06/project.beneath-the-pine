FROM node:22-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile

COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter @beneath-the-pine/contracts build \
    && pnpm --filter @beneath-the-pine/api build \
    && pnpm --filter @beneath-the-pine/api deploy --prod --legacy /api-runtime

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=8081
WORKDIR /app
COPY --from=build --chown=node:node /api-runtime ./
USER node
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.API_PORT || 8081) + '/health/ready').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/main.js"]
