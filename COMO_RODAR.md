# OS4U — Como rodar para testes na loja

> **Atualizado em:** Março 2026 — incluindo Financeiro completo, Comissões, Orçamento PDF, Dashboard em tempo real, Estoque, Relatórios, Agenda, Clientes com LTV e Recibo de Entrega.

---

## ✅ PRÉ-REQUISITOS

| Requisito | Mínimo | Recomendado |
|---|---|---|
| Node.js | 18 LTS | 20 LTS |
| npm | 9+ | 10+ |
| RAM | 2GB | 4GB |
| SO | Windows 10 / Ubuntu 20 / macOS 12 | Qualquer |

Baixar Node.js: https://nodejs.org/

---

## 🚀 SUBIR EM 5 MINUTOS (modo SQLite — sem banco externo)

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Backend rodando em: `http://localhost:3005`

### 2. Frontend (outro terminal)

```bash
cd frontend
npm install
npm run dev
```

Abrir no navegador: `http://localhost:5173`

### 3. Primeiro login

| Campo | Valor |
|---|---|
| E-mail | admin@admin.com |
| Senha | Admin@123 |

---

## 📱 ACESSAR DO CELULAR / TABLET DA LOJA (rede local)

```bash
# Descobrir IP do computador
# Windows: ipconfig → IPv4 Address
# Linux/Mac: ip a

# Backend .env — adicionar/alterar:
PORT=3005

# Frontend — criar arquivo .env.local:
VITE_API_URL=http://SEU_IP:3005

# Rodar frontend na rede:
npm run dev -- --host 0.0.0.0
```

Acessar de qualquer dispositivo no Wi-Fi: `http://SEU_IP:5173`

---

## ⚙️ CONFIGURAÇÃO INICIAL (fazer antes de usar)

### Obrigatório
- [ ] **Settings > Empresa** — Nome, CNPJ, telefone, endereço, logo
- [ ] **Settings > Usuários** — Criar técnicos (role: technician)
- [ ] **Settings > OS** — Número inicial do protocolo, dias de garantia padrão
- [ ] **Estoque** — Cadastrar serviços (ex: "Troca de tela", "Diagnóstico")
- [ ] **Trocar JWT_SECRET** no `.env` para uma string aleatória longa

### Recomendado
- [ ] **Settings > WhatsApp** — Conectar Evolution API para mensagens automáticas
- [ ] **Settings > Comissões** — Ativar e definir % padrão por técnico
- [ ] **Settings > Termos** — Texto de garantia que aparece nos recibos e orçamentos
- [ ] **Settings > Impressora Térmica** — Se tiver impressora 58mm ou 80mm

---

## 🗄️ BANCO DE DADOS

### SQLite (padrão — ideal para testes)
Nenhuma configuração necessária. O banco é criado automaticamente em `backend/database.sqlite`.

**Backup:** copiar o arquivo `database.sqlite` para pendrive/nuvem todo dia.

### PostgreSQL (produção)
```env
# backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha
DB_DATABASE=assistencia_db
```

---

## 🔄 SE JÁ TINHA O BANCO RODANDO (migração)

Se você usava uma versão anterior do sistema, o TypeORM vai tentar migrar automaticamente. Se der erro:

**SQLite — solução mais simples:**
```bash
# ATENÇÃO: isso apaga todos os dados. Faça backup antes!
rm backend/database.sqlite
# Reiniciar o backend — ele recria tudo limpo
```

**PostgreSQL — adicionar colunas novas:**
```sql
-- Tabelas novas (criadas automaticamente pelo TypeORM synchronize)
-- commissions, quote_documents

-- Colunas novas em transactions:
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'paid';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "dueDate" VARCHAR;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "paidDate" VARCHAR;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "competenceDate" VARCHAR;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS supplier VARCHAR;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "costCenter" VARCHAR;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes VARCHAR;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "documentNumber" VARCHAR;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "recurrenceType" VARCHAR;

-- Colunas novas em clients:
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birthday VARCHAR;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;

-- Colunas novas em order_services (recibo de entrega):
ALTER TABLE order_services ADD COLUMN IF NOT EXISTS "receiptSignature" TEXT;
ALTER TABLE order_services ADD COLUMN IF NOT EXISTS "receiptSignerName" VARCHAR;
ALTER TABLE order_services ADD COLUMN IF NOT EXISTS "receiptSignerDoc" VARCHAR;
ALTER TABLE order_services ADD COLUMN IF NOT EXISTS "receiptNotes" TEXT;
ALTER TABLE order_services ADD COLUMN IF NOT EXISTS "receiptAt" TIMESTAMP;
```

---

## 🧪 FLUXO DE TESTES RECOMENDADO

### 1. OS básica (10 min)
1. Menu **Clientes** → Novo Cliente → preencher nome e WhatsApp
2. Menu **Ordens de Serviço** → Nova OS → selecionar cliente
3. Adicionar equipamento (ex: Samsung Galaxy A54 / tela quebrada)
4. Trocar status: **Aberta → Diagnóstico → Em Reparo → Finalizada → Entregue**
5. Na entrega: abrir aba **Financeiro 💰** → clicar **Gerar Recibo de Entrega Digital**
6. Assinar na tela → imprimir recibo

### 2. Orçamento formal (5 min)
1. Abrir uma OS → aba **Orçamento 📝**
2. Clicar **Importar peças da OS** (ou adicionar manualmente)
3. Colocar desconto de 5%
4. Clicar **Salvar Rascunho**
5. Clicar **⬇ PDF** — baixa o orçamento formatado

### 3. Financeiro (5 min)
1. Menu **Financeiro** → **+ Lançamento**
2. Registrar uma entrada (pagamento de OS)
3. Registrar uma saída pendente (aluguel do mês)
4. Ver aba **A Pagar / Receber** → botão "Pagar"
5. Ver aba **DRE Mensal**

### 4. Comissões (3 min)
1. Menu **Comissões** → botão **Regras**
2. Ativar comissões → definir taxa padrão (ex: 10%)
3. Entregar uma OS → voltar em Comissões
4. O técnico aparece no ranking automaticamente

### 5. Estoque (5 min)
1. Menu **Estoque** → **+ Novo Item** → cadastrar uma peça
2. Definir estoque mínimo (ex: 5)
3. Clicar botão **⇆** → Entrada → colocar quantidade
4. Ver aba **Alertas** e **Curva ABC**

---

## ⚠️ O QUE AINDA NÃO ESTÁ PRONTO

| Funcionalidade | Status |
|---|---|
| Nota Fiscal NF-e | Módulo existe, precisa configurar provedor (NuvemFiscal) e certificado digital |
| WhatsApp | Funciona, precisa de instância Evolution API separada |
| Backup automático | Fazer manualmente por enquanto |
| Multi-loja | Backend suporta, UI não tem seletor ainda |
| PWA / app instalável | O sistema funciona no celular, mas ainda não tem ícone na tela inicial |

---

## 🐳 DOCKER (opcional — produção)

```bash
# Subir tudo com Docker Compose (Postgres + Backend)
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Parar
docker-compose down
```

Acessar: `http://localhost:3005` (backend) e servir o frontend buildado.

---

## 🆘 PROBLEMAS COMUNS

**"Cannot connect to database"**
→ Se usar SQLite, não precisa de banco. Verificar se o `.env` tem `DB_HOST` definido.

**"Port 3005 already in use"**
→ `npx kill-port 3005` ou trocar a porta no `.env`.

**"CORS error" no frontend**
→ Verificar que `VITE_API_URL` no frontend aponta para o IP/porta correto do backend.

**WhatsApp não envia**
→ Evolution API precisa estar rodando e o número precisa estar conectado (QR Code).

**PDF não baixa**
→ Verificar se o bloqueador de pop-ups do navegador está bloqueando.

**Comissão não gerou ao entregar OS**
→ Verificar em Settings > Comissões se está habilitado (`finance_commission_enabled = true`).
