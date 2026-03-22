# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# VITE_API_URL é injetado em build time via ARG
ARG VITE_API_URL=http://localhost:3005
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Nginx ──────────────────────────────────────────
FROM nginx:1.25-alpine

# Config nginx otimizada para SPA React
COPY --from=builder /app/dist /usr/share/nginx/html

COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
