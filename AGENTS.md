# AGENTS.md — Guia Universal para Agentes de IA

> **Leia este arquivo primeiro.** Ele é o ponto de entrada para qualquer agente de IA (Claude, Gemini, GPT, Copilot, etc.) que precise entender e trabalhar neste projeto.

---

## 🏗️ O que é o OS4U

**OS4U** é uma plataforma SaaS multi-tenant de Ordens de Serviço para assistências técnicas de eletrônicos (celulares, notebooks, etc.).

| Item | Detalhe |
|------|---------|
| **Stack** | React + Vite (frontend) · NestJS/Node.js (backend) · PostgreSQL 16 |
| **Multi-tenant** | Isolamento lógico por `tenantId` em todas as queries |
| **Integrações** | WhatsApp via Evolution API v1.8.2 |
| **Repo** | `github.com/marcelbr78/ordem-de-servico` |
| **Branches** | `main` (produção, protegida) → `develop` (integração) → `feature/*` |

---

## 📚 Documentação de referência

### Contexto do projeto (obrigatório)

Antes de qualquer tarefa, leia estes arquivos:

| Arquivo | Conteúdo |
|---------|----------|
| [`CLAUDE.md`](./CLAUDE.md) | Instruções específicas para agentes Claude Code — identificação de ambiente (servidor vs notebook), memórias compartilhadas e regras de trabalho |
| [`claude-memory/project_context.md`](./claude-memory/project_context.md) | Contexto completo: arquitetura, ambientes, estado atual, pendências e comandos úteis |
| [`claude-memory/coordination_roles.md`](./claude-memory/coordination_roles.md) | Papéis entre Claude do Servidor e Claude do Notebook — protocolo de deploy |
| [`claude-memory/feedback_workflow.md`](./claude-memory/feedback_workflow.md) | Como o usuário (Nilson) prefere trabalhar |
| [`claude-memory/feedback_autonomy.md`](./claude-memory/feedback_autonomy.md) | Executar sem parar para confirmar cada passo |

---

### Documentação técnica — `docs/`

A documentação técnica está organizada em três categorias:

#### 🏛️ [`docs/architecture/`](./docs/architecture/) — Arquitetura e visão geral do sistema

| Arquivo | Descrição |
|---------|-----------|
| [`system_overview.md`](./docs/architecture/system_overview.md) | Visão geral da plataforma OS4U — pilares, módulos e funcionalidades |
| [`system_architecture.md`](./docs/architecture/system_architecture.md) | Arquitetura completa — módulos backend, sistema de eventos, Smart Modules e Admin SaaS |
| [`saas_architecture.md`](./docs/architecture/saas_architecture.md) | Multi-tenancy, TenantMiddleware, SuperAdminGuard e cálculo de MRR |
| [`saas_modules.md`](./docs/architecture/saas_modules.md) | Lógica SaaS — planos (Starter/Professional/Enterprise), trials e onboarding |
| [`database_schema.md`](./docs/architecture/database_schema.md) | Schema do banco — tabelas core, quoting, inventory e smart patterns |
| [`events.md`](./docs/architecture/events.md) | Arquitetura de eventos — EventEmitter2, listeners SmartDiagnostics e SmartPricing |
| [`git_workflow.md`](./docs/architecture/git_workflow.md) | Branch protection, convenções de branch e fluxo de feature |
| [`git_snapshot.md`](./docs/architecture/git_snapshot.md) | Snapshot de desenvolvimento (março 2026) — estado do sistema |

#### ⚙️ [`docs/backend/`](./docs/backend/) — Backend (NestJS)

| Arquivo | Descrição |
|---------|-----------|
| [`backend_architecture.md`](./docs/backend/backend_architecture.md) | Módulos NestJS — Core ERP, Admin e Multi-Tenancy Engine |
| [`api_endpoints.md`](./docs/backend/api_endpoints.md) | Todos os endpoints REST — Orders, SmartParts, Inventory, Admin e Smart Modules |
| [`clients-module-validation.md`](./docs/backend/clients-module-validation.md) | Validação do módulo de Clientes — PF/PJ, CPF/CNPJ, LGPD, limites e fronteiras |
| [`smartparts_learnings.md`](./docs/backend/smartparts_learnings.md) | Aprendizados do SmartParts — cotação WhatsApp, parsing de preços, Evolution API |
| [`ai_board_diagnosis_module.md`](./docs/backend/ai_board_diagnosis_module.md) | Módulo de diagnóstico de placas — arquitetura, fluxo guiado e integração com IA |

#### 🎨 [`docs/frontend/`](./docs/frontend/) — Frontend (React + Vite)

| Arquivo | Descrição |
|---------|-----------|
| [`frontend_architecture.md`](./docs/frontend/frontend_architecture.md) | Layout, páginas Admin SaaS, Global Search, Charts e design system Glassmorphism |
| [`frontend_structure.md`](./docs/frontend/frontend_structure.md) | Estrutura React, Smart Assistant Panel, rotas Admin SaaS e debounce |
| [`admin_panel_features.md`](./docs/frontend/admin_panel_features.md) | Features do painel admin — MRR, Forecast, Churn, Insights Engine e Global Search |

---

## ⚡ Regras universais para qualquer agente

1. **Leia a documentação antes de agir** — entenda o contexto antes de propor ou implementar mudanças
2. **Respeite a arquitetura multi-tenant** — `tenantId` é obrigatório no WHERE final de toda query
3. **Máximo 5 dependências por service** — princípio arquitetural do projeto
4. **OS é registro, não orquestrador** — desacoplamento por eventos
5. **1 aba = 1 componente** — regra de frontend
6. **Staging antes de produção** — testes locais → develop → PR → main
7. **Nunca commitar direto na `main`** — branch protegida, exige PR via `develop`
8. **Execução autônoma** — analisar → listar o que será feito → pedir aprovação → executar tudo → 1 resumo no final

---

## 🗂️ Estrutura do projeto

```
ordem-de-servico/
├── AGENTS.md                  ← Você está aqui
├── CLAUDE.md                  ← Instruções específicas para Claude Code
├── README.md                  ← README do repositório
├── COMO_RODAR.md              ← Como rodar o projeto localmente
├── DEPLOY.md                  ← Guia de deploy em produção
├── GIT_SETUP.md               ← Configuração Git
│
├── claude-memory/             ← Memórias compartilhadas entre agentes Claude
│   ├── MEMORY_SHARED.md
│   ├── project_context.md
│   ├── coordination_roles.md
│   ├── feedback_workflow.md
│   └── feedback_autonomy.md
│
├── docs/                      ← Documentação técnica do projeto
│   ├── architecture/          ← Arquitetura, schema, eventos, SaaS, Git
│   ├── backend/               ← NestJS modules, API, validações, learnings
│   └── frontend/              ← React pages, layout, admin panel
│
├── backend/                   ← Código-fonte do backend (NestJS)
├── frontend/                  ← Código-fonte do frontend (React + Vite)
│
├── docker-compose.yml         ← Docker Compose principal
├── docker-compose.local.yml   ← Docker Compose para ambiente local
└── docker-compose.prod.yml    ← Docker Compose para produção
```

---

## 🔗 Links rápidos

- **Produção**: [os4u.com.br](https://os4u.com.br) / [api.os4u.com.br](https://api.os4u.com.br)
- **Git**: [github.com/marcelbr78/ordem-de-servico](https://github.com/marcelbr78/ordem-de-servico)
- **Evolution API**: [evolution.os4u.com.br](https://evolution.os4u.com.br)

---

*Este arquivo é mantido atualizado e serve como ponto de entrada universal para qualquer agente de IA que trabalhe neste repositório.*
