# OS4U — Setup Git: branch nova sem perder a main

## Situação
- `main` → sistema atual com OS dos clientes, rodando internamente
- `os4u-new` → branch com tudo que foi desenvolvido aqui (nova versão)
- **Objetivo:** subir a nova versão no notebook em paralelo, sem tocar na main

---

## PASSO A PASSO COMPLETO

### 1. No repositório os4u no GitHub — configurar o remote

```bash
# No terminal, dentro da pasta do projeto que você quer publicar
# (os arquivos que estão aqui, desenvolvidos nessa sessão)

git init
git remote add origin https://github.com/SEU_USUARIO/os4u.git
```

### 2. Criar a branch nova e subir tudo

```bash
# Criar branch da nova versão
git checkout -b os4u-new

# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "feat: sistema OS4U completo — financeiro, comissões, orçamento PDF, dashboard, estoque, relatórios, clientes avançados, recibo digital"

# Subir para o GitHub
git push -u origin os4u-new
```

### 3. No notebook da loja — clonar e subir com Docker

```bash
# Clonar apenas a branch nova (não baixa a main)
git clone --branch os4u-new --single-branch https://github.com/SEU_USUARIO/os4u.git os4u-new
cd os4u-new

# Copiar e preencher o .env
cp .env.local.example .env
nano .env   # ou notepad .env no Windows
```

**Preencher no .env:**
```
VITE_API_URL=http://SEU_IP_DO_NOTEBOOK:3005
DB_PASSWORD=uma_senha_forte
JWT_SECRET=uma_string_longa_aleatoria
```

**Descobrir o IP do notebook:**
- Windows: abrir cmd → `ipconfig` → procurar "Endereço IPv4" (ex: 192.168.1.100)
- Linux/Mac: `ip a` → procurar `inet` na interface Wi-Fi

```bash
# Criar pasta de certs (necessária mesmo vazia)
mkdir -p certs

# Subir o sistema
docker compose -f docker-compose.local.yml up -d

# Acompanhar os logs (Ctrl+C para sair dos logs, sistema continua rodando)
docker compose -f docker-compose.local.yml logs -f
```

**Pronto! Acessar:**
- Do notebook: `http://localhost`
- De qualquer celular/tablet na mesma rede Wi-Fi: `http://192.168.1.100`
- Login: `admin@admin.com` / `Admin@123`

---

### 4. Manter a main funcionando em paralelo

A main continua rodando normalmente onde já está — Docker isola completamente os dois sistemas. Eles nem enxergam um ao outro.

Se a main também usa Docker na mesma máquina, só precisa garantir que as portas não conflitam:
- Nova versão: porta 80 (frontend) e 3005 (backend)
- Main: pode continuar nas portas dela (ex: 3000 e 5173)

Se der conflito de porta 80, editar o `docker-compose.local.yml`:
```yaml
frontend:
  ports:
    - '8080:80'   # trocar 80 por 8080
```
E atualizar o `.env`: `VITE_API_URL=http://SEU_IP:3005`

---

### 5. Atualizar depois (quando fizer mudanças)

```bash
# No computador onde você desenvolve:
git add .
git commit -m "feat: descrição do que mudou"
git push origin os4u-new

# No notebook da loja:
cd os4u-new
git pull origin os4u-new
docker compose -f docker-compose.local.yml up -d --build
```

---

### 6. Quando quiser promover os4u-new para main (no futuro)

```bash
# Fazer merge da branch nova na main quando estiver confiante
git checkout main
git merge os4u-new
git push origin main
```

---

## Estrutura de arquivos necessários no repositório

```
os4u/
├── backend/
│   ├── src/              ← código fonte
│   ├── Dockerfile        ← já existe ✅
│   ├── .dockerignore     ← criado ✅
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/              ← código fonte
│   ├── Dockerfile        ← criado ✅
│   ├── .dockerignore     ← criado ✅
│   ├── package.json
│   └── vite.config.ts
├── nginx/
│   └── nginx.conf        ← criado ✅ (para prod com domínio)
├── certs/                ← pasta vazia (adicionada pelo git init)
├── .gitignore            ← criado ✅
├── .env.example          ← criado ✅
├── .env.local.example    ← criado ✅
├── docker-compose.yml    ← produção com HTTPS ✅
├── docker-compose.local.yml ← notebook da loja ✅
├── deploy.sh             ← script de deploy ✅
├── backup.sh             ← backup automático ✅
├── DEPLOY.md             ← guia completo ✅
└── COMO_RODAR.md         ← guia rápido ✅
```

---

## Comandos úteis no dia a dia

```bash
# Ver status dos containers
docker compose -f docker-compose.local.yml ps

# Ver logs em tempo real
docker compose -f docker-compose.local.yml logs -f backend

# Reiniciar só o backend (após mudança)
docker compose -f docker-compose.local.yml restart backend

# Parar tudo
docker compose -f docker-compose.local.yml down

# Parar e apagar banco (CUIDADO — perde dados)
docker compose -f docker-compose.local.yml down -v

# Backup manual do banco
docker compose -f docker-compose.local.yml exec postgres \
  pg_dump -U os4u assistencia_db > backup_$(date +%Y%m%d).sql
```
