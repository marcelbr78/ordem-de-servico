---
name: Contexto completo do projeto OS4U
description: O que é o projeto, arquitetura, estado atual e pendências — lido pelos dois Claudes
type: project
---

## O que é o OS4U

Sistema de Ordens de Serviço (OS) multi-tenant para assistências técnicas.
- Multi-tenant: cada loja é um tenant isolado
- Usuários: ~22 usuários em 2 lojas (tenants)
- Stack: React (frontend) + Node.js/Express (backend) + PostgreSQL

## Arquitetura

- **Frontend:** React + Vite, rodando em Docker (:80 em produção)
- **Backend:** Node.js + Express + Prisma ORM, rodando em Docker (:3005 em produção)
- **Banco:** PostgreSQL 16 — banco `assistencia_db`
- **WhatsApp:** Evolution API v1.8.2 (porta :8080, instância `os4u_nanotechcell`)

### Princípios arquiteturais obrigatórios:
- OS é registro (não orquestrador) — desacoplamento por eventos
- Máximo 5 dependências por service
- 1 aba = 1 componente
- Fluxo guiado por status

## Ambientes

| Ambiente | Frontend | Backend | Banco |
|----------|----------|---------|-------|
| Produção (Linux) | :80 / os4u.com.br | :3005 / api.os4u.com.br | assistencia_db |
| Staging (Windows) | :8081 | :3006 | assistencia_db_staging |

## Estado atual (2026-03-30)

- Sistema 100% em produção no servidor Linux
- Evolution API rodando e integrada
- Cloudflare Tunnel ativo (domínios públicos funcionando)
- 7 tenants + 13 usuários em produção

## Segurança multi-tenant

- `tenantId` OBRIGATÓRIO no WHERE final de toda query
- Validação explícita no controller
- Exceção: `super_admin` só em users
- Módulos já corrigidos: orders, clients, inventory, finance, bank-accounts, audit, warranties
- Vulnerabilidades ainda pendentes: changeStatus, reports, monitor público, selfRegister

## Pendências abertas

- [ ] Backup externo (Telegram — decisão tomada, ainda não configurado)
- [ ] Autostart dos containers no boot do Linux
- [ ] Commitar arquivos não versionados: warranties module, event listeners, order-notification.service
- [ ] Configurar DDNS (IP externo é dinâmico: 177.5.128.43)
- [ ] Corrigir vulnerabilidades multi-tenant restantes: changeStatus, reports, monitor público, selfRegister
- [ ] Bugs QA médios: input lag, duplicação de texto (staging)

## Git

- **Repositório:** github.com/marcelbr78/ordem-de-servico
- **Branch main** = produção (protegida — exige PR)
- **Branch develop** = próxima versão
- **Branches backlog:** feature/admin-panel, feature/ai-board-diagnosis, feature/modulo-diagnostico-power-sequence
- **Tag segurança:** v1.1.3-snapshot-local (snapshot 27/03/2026)
- **Fluxo:** feature/xxx → develop → PR → main

## Comandos úteis no servidor

```bash
# Status dos containers
echo Nilson48 | sudo -S docker compose -f docker-compose.local.yml ps

# Logs em tempo real
echo Nilson48 | sudo -S docker compose -f docker-compose.local.yml logs -f

# Deploy (após git pull)
echo Nilson48 | sudo -S docker compose -f docker-compose.local.yml up -d --build --no-deps frontend
echo Nilson48 | sudo -S docker compose -f docker-compose.local.yml up -d --build --no-deps backend
```
