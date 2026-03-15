#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  OS4U — Script de deploy/atualização                        ║
# ║  Uso: bash deploy.sh                                         ║
# ╚══════════════════════════════════════════════════════════════╝
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info() { echo -e "${GREEN}[OS4U]${NC} $1"; }
warn() { echo -e "${YELLOW}[AVISO]${NC} $1"; }
error() { echo -e "${RED}[ERRO]${NC} $1"; exit 1; }

# 1. Verificar .env
if [ ! -f .env ]; then
  error "Arquivo .env não encontrado. Copie .env.example para .env e configure."
fi

# 2. Verificar variáveis obrigatórias
source .env
[ -z "$DB_PASSWORD" ]  && error "DB_PASSWORD não definido no .env"
[ -z "$JWT_SECRET" ]   && error "JWT_SECRET não definido no .env"

info "Iniciando deploy OS4U..."

# 3. Criar pasta de certs se não existir
mkdir -p certs nginx/ssl

# 4. Pull das imagens base
info "Baixando imagens Docker..."
docker compose pull --ignore-buildable

# 5. Build (apenas o que mudou)
info "Fazendo build das imagens..."
docker compose build --no-cache backend frontend

# 6. Parar e subir (zero downtime com restart)
info "Subindo containers..."
docker compose up -d --remove-orphans

# 7. Aguardar backend ficar saudável
info "Aguardando backend iniciar..."
TRIES=0
until docker compose exec -T backend node -e "require('http').get('http://localhost:3005/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))" 2>/dev/null; do
  TRIES=$((TRIES+1))
  if [ $TRIES -gt 30 ]; then
    warn "Backend demorou para responder. Verificar logs: docker compose logs backend"
    break
  fi
  echo -n "."
  sleep 2
done

# 8. Limpar imagens antigas
info "Limpando imagens antigas..."
docker image prune -f

# 9. Status final
echo ""
info "Deploy concluído!"
echo ""
docker compose ps
echo ""
echo -e "${GREEN}✅ Sistema rodando em: ${FRONTEND_URL:-http://localhost}${NC}"
echo "   Logs: docker compose logs -f"
echo "   Parar: docker compose down"
