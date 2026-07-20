# syntax=docker/dockerfile:1.8

ARG NODE_IMAGE=node:lts-alpine
ARG PNPM_VERSION=latest-11

# 1. Estágio base
FROM ${NODE_IMAGE} AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
ENV PNPM_CHECK_UPDATE=false

WORKDIR /app

# Atualiza pacotes do Alpine e força a atualização do npm e corepack
# Isso resolve a vulnerabilidade do picomatch no diretório global do npm
RUN apk update && apk upgrade \
  && npm install -g npm@latest corepack@latest \
  && corepack enable \
  && corepack prepare pnpm@${PNPM_VERSION} --activate \
  && rm -rf /root/.npm /root/.cache

# 2. Estágio de dependências
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --ignore-scripts

# 3. Estágio de build
FROM deps AS build
COPY . .
RUN pnpm check
RUN pnpm build
RUN pnpm prune --prod --ignore-scripts

# 4. Estágio de runtime
# Herdando de 'base' garantimos que o apk upgrade e o npm atualizado sejam mantidos
FROM base AS runtime

LABEL org.opencontainers.image.source="https://pandeiro-de-bamba.onrender.com" \
  org.opencontainers.image.title="Pandeiro de Bamba Web App" \
  org.opencontainers.image.vendor="Pandeiro de Bamba" \
  org.opencontainers.image.authors="Alan Franco <alanfr.engel@proton.me>" \
  org.opencontainers.image.licenses="AGPL-3.0"

ENV NODE_ENV="production"
ENV HOST="0.0.0.0"
ENV PORT="3000"

WORKDIR /app

COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "const u=process.env.BASIC_AUTH_USER,p=process.env.BASIC_AUTH_PASSWORD;const h=u&&p?{authorization:'Basic '+Buffer.from(u+':'+p).toString('base64')}:{};fetch('http://127.0.0.1:3000/',{headers:h}).then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

ENTRYPOINT []
CMD ["node", "build"]