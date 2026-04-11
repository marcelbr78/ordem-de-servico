# PLAN_BE.MD — Backend Refactoring Plan

> **Plano de modernização do backend OS4U**
> Baseado na auditoria do código-fonte NestJS + TypeORM.
> Última atualização: Abril 2026

---

## 📊 Diagnóstico Atual

### Resumo da Auditoria

| Métrica | Valor | Nível |
|---------|-------|-------|
| Total de módulos | 27 | — |
| "God Service" | `OrdersService` (~700 linhas) | 🔴 Crítico |
| Uso de `: any` / `as any` | Recorrente em services e controllers | 🔴 Crítico |
| Lógica de Multi-tenancy | Manual em cada query (`where: { tenantId }`) | 🔴 Crítico |
| Repositories Customizados | 0 (Uso direto de `Repository<T>` ou QueryBuilder) | 🟡 Médio |
| Validação de DTOs | inconsistente (alguns usam `Record<string, any>`) | 🟡 Médio |
| Event-Driven | Presente via `EventDispatcher` mas pouco explorado | 🟡 Médio |
| Logs do Sistema | `console.log` / `console.error` dispersos | 🟡 Médio |

### Maiores Arquivos (Complexidade)

| Arquivo | Tamanho | Linhas | Problema |
|---------|---------|--------|----------|
| `OrdersService.ts` | 30 KB | 700 | God Service: CRUD + Stats + PDF + WhatsApp + SLA |
| `InventoryService.ts` | 7.6 KB | 172 | Lógica de estoque + ABC + Validação de Plano |
| `main.ts` | 7 KB | 116 | Inicialização carregada com SQLs de alteração de tabela |
| `app.module.ts` | 11 KB | 170 | Imports massivos e configuração TypeORM complexa |

---

## 🔴 Problemas Identificados

### 1. God Services (Violação do SRP)
**Impacto: CRÍTICO**
`OrdersService` concentra toda a inteligência do sistema. Ele sabe como gerar protocolos, como calcular SLA, como notificar WhatsApp e como gerar estatísticas de dashboard. Isso torna testes unitários quase impossíveis e aumenta o risco de efeitos colaterais.

### 2. Multi-tenancy Manual (Fuga de Dados)
**Impacto: CRÍTICO**
A isolação por `tenantId` é feita manualmente em cada chamada de banco. Se um desenvolvedor esquecer de adicionar `.andWhere('t.tenantId = :tenantId')`, dados de um cliente podem vazar para outro. Não há um mecanismo central (como um `TenantInterceptor` ou `BaseRepository`) que garanta isso nativamente.

### 3. Duplicação de Lógica de Negócio (Plano/SaaS)
**Impacto: ALTO**
A verificação de limites (ex: "quantas OS este plano permite") está espalhada entre `OrdersService` e `InventoryService`. Mudanças na regra de planos exigem alterações em múltiplos módulos.

### 4. Inicialização Frágil (`main.ts`)
**Impacto: MÉDIO**
O `main.ts` contém comandos SQL hardcoded para criação e alteração de colunas (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). Isso deveria ser gerenciado via Migrations oficiais do TypeORM para garantir consistência entre ambientes (Dev/Staging/Prod).

---

## 🎯 Plano de Execução

---

### FASE 1: Foundation — Core Refactoring
**Prioridade: 🔴 CRÍTICA | Risco: MÉDIO | Impacto: MUITO ALTO**

#### 1.1 — Centralização do Multi-tenancy
**Meta:** Eliminar a necessidade de passar `tenantId` manualmente em cada service.
- [ ] Implementar um `TenantInterceptor` que extrai o ID do request e injeta em um `AsyncLocalStorage` (Namespace).
- [ ] Criar um `BaseRepository` que aplica automaticamente o filtro de `tenantId` em todas as queries.
- [ ] Refatorar entities para garantir que `tenantId` seja preenchido automaticamente no `BeforeInsert`.

#### 1.2 — Logger Service Centralizado
**Meta:** Padronizar logs e remover `console.log`.
- [ ] Criar um serviço de Logger (baseado em `winston` já presente no package.json).
- [ ] Implementar níveis de log (INFO, WARN, ERROR, DEBUG).
- [ ] Substituir logs dispersos por `this.logger.error(...)`.

#### 1.3 — Migrations Management
**Meta:** Remover SQLs do `main.ts`.
- [ ] Mover todos os SQLs de "pré-inicialização" do `main.ts` para arquivos de migration adequados (`src/migrations`).
- [ ] Garantir que o comando `npm run migration:run` faça parte do pipeline de CI/CD.

---

### FASE 2: Decomposition — Breaking God Services
**Prioridade: 🔴 CRÍTICA | Risco: ALTO | Impacto: ALTO**

#### 2.1 — Refatoração do OrdersService
Quebrar em serviços especializados:
- `OrderCrudService`: Apenas criação e atualização básica.
- `OrderStatusFlowService`: Inteligência de transição de status e workflow customizado.
- `OrderStatsService`: Lógica de estatísticas para Dashboard e Reports.
- `OrderSlaService`: Cálculos de atrasos e SLA.
- `OrderProtocolService`: Lógica de geração de sequencial de protocolo.

#### 2.2 — Segregação de Notificações
- [ ] Remover dependências de WhatsApp/Push de dentro dos serviços de domínio.
- [ ] Usar 100% de Eventos (`EventEmitter2` ou `EventDispatcher`) para disparar comunicações.
- [ ] Criar `OrderCreatedListener`, `OrderStatusChangedListener`.

---

### FASE 3: SaaS & Shared Modules
**Prioridade: 🟡 ALTA | Risco: MÉDIO | Impacto: ALTO**

#### 3.1 — Plano Enforcement Module
- [ ] Criar um `Guard` ou `Interceptor` central chamado `PlanQuotasGuard`.
- [ ] Decorar rotas com `@RequireQuota('orders')`.
- [ ] Centralizar toda a lógica de "quota check" em um único serviço reutilizável.

#### 3.2 — Shared DTOs & Strict Typing
- [ ] Criar uma biblioteca de tipos compartilhados (ou módulo `common/interfaces`).
- [ ] Eliminar todos os `: any` e `Record<string, any>` dos controllers.
- [ ] Garantir que todo response seja serializado via `ClassSerializerInterceptor`.

---

### FASE 4: Performance & Scalability
**Prioridade: 🟢 BAIXA | Risco: BAIXO | Impacto: MÉDIO**

#### 4.1 — Database Optimization
- [ ] Adicionar índices nas colunas `tenantId` de todas as tabelas (essencial para performance multi-tenant).
- [ ] Implementar Cache Manager (Redis ou Memory) para configurações de sistema e planos.

---

## 📅 Timeline Sugerida

| Fase | Período | Foco |
|------|-----------|------|
| **Fase 1** | 1 semana | Estrutura: Multi-tenancy, Logger, Migrations |
| **Fase 2** | 2 semanas | Domínio: Quebrar God Services (Orders/Inventory) |
| **Fase 3** | 1 semana | SaaS: Quotas e Tipagem Estrita |
| **Fase 4** | Contínuo | Otimização e Índices |

---

## 📎 Checklist de Qualidade (Definitive Guide)

- [ ] Nenhum service com mais de 5 dependências (DI).
- [ ] Nenhum service com mais de 300 linhas.
- [ ] Inexistência de `console.log` / `console.error`.
- [ ] Zero vazamento de `: any` em rotas públicas.
- [ ] 100% das migrations testadas em ambiente local/staging.

---
*Este plano segue os princípios definidos no AGENTS.md e no skill de NestJS Best Practices.*
