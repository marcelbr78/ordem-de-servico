# ======================================
# Stage 1 — Build
# ======================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ======================================
# Stage 2 — Production
# ======================================
FROM node:20-alpine AS runner

WORKDIR /app

# Instalar apenas prod deps
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copiar build compilado
COPY --from=builder /app/dist ./dist

# Certificado fiscal (será montado via volume em produção)
RUN mkdir -p /app/certs

# Criar usuário não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3005

CMD ["node", "dist/src/main"]
