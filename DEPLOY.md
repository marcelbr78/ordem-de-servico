# OS4U — Guia de Deploy

## Cenários disponíveis

| Cenário | Comando | Ideal para |
|---------|---------|-----------|
| Teste local rápido | `docker compose -f docker-compose.local.yml up -d` | Testar antes de subir |
| VPS/servidor com domínio | `bash deploy.sh` | Produção real com HTTPS |
| Desenvolvimento | `npm run start:dev` (backend) + `npm run dev` (frontend) | Desenvolvimento |

---

## 1. Teste local com Docker (mais rápido)

Não precisa de domínio nem SSL. Tudo sobe em ~3 minutos.

```bash
# Na pasta do projeto:
docker compose -f docker-compose.local.yml up -d

# Acompanhar logs:
docker compose -f docker-compose.local.yml logs -f

# Parar:
docker compose -f docker-compose.local.yml down
```

**Acessos:**
- Sistema: http://localhost:5173
- API: http://localhost:3005
- Login: admin@admin.com / Admin@123

---

## 2. Deploy em VPS (produção com HTTPS)

### Pré-requisitos
- VPS com Ubuntu 22.04 (mín. 2GB RAM, 20GB disco)
- Domínio apontando para o IP da VPS (DNS)
- Docker + Docker Compose instalados

### Instalar Docker na VPS
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Logout e login de volta
```

### Subir o sistema

```bash
# 1. Clonar / copiar os arquivos para a VPS
scp -r ./projeto-corrigido usuario@IP_DA_VPS:/opt/os4u

# 2. Na VPS:
cd /opt/os4u

# 3. Criar .env a partir do exemplo
cp .env.example .env
nano .env   # preencher DB_PASSWORD, JWT_SECRET, FRONTEND_URL, VITE_API_URL

# 4. Criar pasta de certs (SSL será gerado automaticamente)
mkdir -p nginx/ssl certs

# 5. Gerar SSL com Let's Encrypt ANTES de subir com HTTPS
# Substitua SEU_DOMINIO.com.br pelo seu domínio real
docker run --rm -v ./nginx/ssl:/etc/letsencrypt \
  -v ./nginx/certbot_www:/var/www/certbot \
  -p 80:80 certbot/certbot certonly \
  --standalone \
  -d SEU_DOMINIO.com.br \
  -d www.SEU_DOMINIO.com.br \
  --email seu@email.com \
  --agree-tos --no-eff-email

# 6. Editar nginx.conf: trocar SEU_DOMINIO.com.br pelo seu domínio
sed -i 's/SEU_DOMINIO.com.br/seu-dominio.com.br/g' nginx/nginx.conf

# 7. Deploy!
bash deploy.sh
```

### Verificar se está rodando
```bash
docker compose ps
docker compose logs backend --tail=50
curl http://localhost:3005/health
```

---

## 3. Configurar backup automático

```bash
# Adicionar ao crontab (backup todo dia às 3h da manhã)
crontab -e

# Adicionar a linha:
0 3 * * * cd /opt/os4u && bash backup.sh >> logs/backup.log 2>&1
```

---

## 4. Atualizar o sistema

```bash
cd /opt/os4u
git pull          # ou copiar os novos arquivos
bash deploy.sh    # rebuild automático apenas do que mudou
```

---

## 5. Variáveis de ambiente — guia rápido

### Mínimas obrigatórias
```env
DB_PASSWORD=senha_forte_aqui
JWT_SECRET=string_aleatoria_longa_aqui
FRONTEND_URL=https://seu-dominio.com.br
VITE_API_URL=https://api.seu-dominio.com.br
```

### Gerar JWT_SECRET seguro
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### WhatsApp (Evolution API)
Você precisa de uma instância Evolution API rodando. Pode ser:
- **Na mesma VPS:** use o `docker-compose-evolution.yml` do backend
- **Serviço externo:** preencher URL e token

```env
EVOLUTION_API_URL=https://evolution.seu-dominio.com.br
EVOLUTION_API_KEY=seu_api_key
EVOLUTION_INSTANCE_ID=minha_loja
```

### E-mail para envio de orçamentos
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=loja@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx   # senha de app do Google
SMTP_FROM=Minha Loja <loja@gmail.com>
```

### Fotos das OS (Cloudinary — gratuito até 25GB)
Cadastro em https://cloudinary.com
```env
CLOUDINARY_CLOUD_NAME=nome_da_conta
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc123...
```

---

## 6. Estrutura de arquivos necessária

```
projeto/
├── backend/
│   ├── Dockerfile          ✅ pronto
│   ├── .dockerignore       ✅ pronto
│   └── src/
├── frontend/
│   ├── Dockerfile          ✅ pronto
│   └── src/
├── nginx/
│   ├── nginx.conf          ✅ pronto (editar domínio)
│   └── ssl/                ← certificados Let's Encrypt
├── certs/                  ← certificado NF-e (.pfx) — só se emitir NF
├── backups/                ← criado pelo backup.sh
├── docker-compose.yml      ✅ produção com HTTPS
├── docker-compose.local.yml ✅ teste local
├── .env.example            ✅ modelo
├── deploy.sh               ✅ script de deploy
└── backup.sh               ✅ script de backup
```

---

## 7. Solução de problemas comuns

**Backend não inicia:**
```bash
docker compose logs backend --tail=100
# Verificar se DB_PASSWORD e JWT_SECRET estão no .env
```

**Banco não conecta:**
```bash
docker compose exec postgres psql -U os4u -d assistencia_db -c "\dt"
# Se não conectar, verificar DB_USERNAME e DB_PASSWORD
```

**Frontend dá erro de API:**
```bash
# Verificar se VITE_API_URL no .env aponta para o backend correto
# Lembrar: é injetado no BUILD, não em runtime
docker compose build --no-cache frontend
```

**SSL não funciona:**
```bash
# Verificar se os arquivos de certificado existem
ls nginx/ssl/live/SEU_DOMINIO.com.br/
# fullchain.pem e privkey.pem devem estar lá
```

**Porta 80/443 já em uso:**
```bash
sudo lsof -i :80
sudo systemctl stop apache2  # ou nginx do sistema
```
