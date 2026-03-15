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

RUN cat > /etc/nginx/conf.d/default.conf << 'NGINX'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 1024;

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA: todas as rotas vão para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Evitar mostrar versão do nginx
    server_tokens off;
}
NGINX

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
