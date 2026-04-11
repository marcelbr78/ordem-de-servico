# PLAN.MD — Frontend Refactoring Plan

> **Plano de modernização do frontend OS4U**
> Baseado na auditoria completa do código-fonte React + Vite.
> Última atualização: Abril 2026

---

## 📊 Diagnóstico Atual

### Resumo da Auditoria

| Métrica | Valor | Nível |
|---------|-------|-------|
| Total de arquivos `.tsx` | ~80+ | — |
| CSS files | 1 (`index.css`) | 🔴 Crítico |
| Uso de `React.lazy()` | 0 | 🔴 Nenhum |
| Uso de `React.memo()` | 0 | 🔴 Nenhum |
| `@keyframes spin` duplicado | **43 instâncias** em 35+ arquivos | 🔴 Crítico |
| `const inp: React.CSSProperties` duplicado | **24 arquivos** | 🔴 Crítico |
| `const lbl: React.CSSProperties` duplicado | **17 arquivos** | 🔴 Crítico |
| Uso de `: any` no TypeScript | **162 ocorrências** | 🟡 Médio |
| Hooks compartilhados | 3 (`useAutocomplete`, `useToast`, `useSystemSettings`) | 🟡 Limitado |
| Error Boundaries | 1 (em `main.tsx`, genérico) | 🟡 Insuficiente |
| `console.log` / `console.error` dispersos | **5 logs + 50+ errors** em 42 arquivos | 🟡 Médio |
| `alert()` nativo para erros | **35 arquivos** | 🟡 Médio |
| Componentes legacy duplicados | `Layout.tsx` + `AppLayout/` coexistem | 🟡 Dívida |

### Maiores Arquivos (Monolíticos)

| Arquivo | Tamanho | Linhas |
|---------|---------|--------|
| `OrderDetails.tsx` | 128 KB | ~3000+ |
| `Inventory.tsx` | 67 KB | 854 |
| `Settings.tsx` | 62 KB | 850 |
| `Warranty.tsx` | 61 KB | ~850 |
| `LandingPage.tsx` | 50 KB | ~800 |
| `Finance.tsx` | 49 KB | 585 |
| `Fiscal.tsx` | 45 KB | ~600 |
| `OrderForm.tsx` | 45 KB | ~600 |
| `HelpSettings.tsx` | 44 KB | ~600 |
| `PublicStatusPixel.tsx` | 43 KB | ~600 |

---

## 🔴 Problemas Identificados

### 1. Inline Styles em 100% dos Componentes

**Impacto: CRÍTICO**

Todos os componentes utilizam `style={{ }}` inline em vez de CSS classes ou CSS modules. Isso causa:
- Bundle JS inflado (estilos são strings JS, não CSS cacheable)
- Impossibilidade de reutilização
- Temas/dark mode hardcoded em código
- Pseudo-seletores impossíveis (`:hover`, `:focus`, `:active`) → workaround com `onMouseEnter/onMouseLeave`
- Media queries impossíveis → workaround com `window.innerWidth` e estado React

**Exemplo do problema** (de `Inventory.tsx`, linha 38):
```tsx
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)', color: '#fff',
  fontSize: '13px', outline: 'none', boxSizing: 'border-box'
};
```
→ Este **mesmo objeto** é definido em **24 arquivos diferentes** com variações mínimas.

### 2. Componentes Monolíticos (God Components)

**Impacto: CRÍTICO**

Páginas que deveriam ser compostas por sub-componentes contêm tudo em um único arquivo:
- `Inventory.tsx` inclui `CurrencyInput`, `AutocompleteInput`, `FiscalSuggester`, `ProductModal`, `MovementModal` — todos definidos no mesmo arquivo
- `Settings.tsx` inclui `Toggle`, `FinanceConfigSettings`, `CustomizationSettings`, lógica de WhatsApp, gerenciamento de usuários
- `Finance.tsx` inclui `TxModal`, `KpiCard`, `DreBar` embutidos
- `Dashboard.tsx` inclui `StatusBadge`, `KpiCard`, `MiniBarChart`, `LiveClock`, `UrgencyBar`

**Violação direta da regra:** `rerender-no-inline-components` — componentes definidos dentro de outros causam remount a cada re-render.

### 3. Duplicação Massiva de Código

**Impacto: ALTO**

| Código Duplicado | Origem | Ocorrências |
|-----------------|--------|-------------|
| `@keyframes spin{to{transform:rotate(360deg)}}` | `<style>` tags inline | **43×** em 35 arquivos |
| `const inp: React.CSSProperties = {...}` | Estilo de input | **24 arquivos** |
| `const lbl: React.CSSProperties = {...}` | Estilo de label | **17 arquivos** |
| `R$(v: number)` — formatação BRL | Utilitário | 5+ arquivos |
| `fmtDate()` / `fmtDatetime()` | Utilitário | 5+ arquivos |
| `KpiCard` componente | Dashboard, Finance | 2 definições independentes |
| `StatusBadge` componente | Dashboard, Orders | 2+ definições |

### 4. Zero Code Splitting (Lazy Loading)

**Impacto: ALTO**

- `React.lazy()` não é utilizado em nenhum lugar
- `Suspense` não é utilizado para carregar componentes
- Todas as 35+ páginas são importadas de forma síncrona no `App.tsx`
- O bundle inicial carrega **tudo** — incluindo páginas admin SaaS que 99% dos usuários nunca acessam

### 5. Zero Memoização

**Impacto: MÉDIO-ALTO**

- `React.memo()` — 0 usos
- `useMemo()` — uso mínimo
- `useCallback()` — usado em poucos lugares, sem padrão consistente
- Listas grandes (Inventory, Orders) re-renderizam inteiras a cada interação

### 6. TypeScript Fraco

**Impacto: MÉDIO**

- **162 usos de `: any`** espalhados pelo código
- Interfaces definidas localmente em cada arquivo em vez de tipos compartilhados
- Sem tipo central para `Order`, `Client`, `Product`, `Transaction`
- Casts com `as any` em diversos pontos (ex: `(product as any)?.ncm`)

### 7. Responsividade via JavaScript

**Impacto: MÉDIO**

Em vez de CSS media queries, a responsividade é feita via:
```tsx
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
useEffect(() => {
  const onResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);
```
→ Re-render do componente inteiro a cada resize. Presente em Dashboard, Settings, AppLayout.

### 8. Código Morto / Legacy

**Impacto: BAIXO**

- `components/Layout.tsx` (174 linhas) — layout legado, substituído por `layout/AppLayout.tsx` mas ainda presente no projeto
- `MasterLayout.tsx` — pode estar em desuso
- `DebugAuth.tsx` — ferramenta de debug em produção

---

## 🎯 Plano de Execução

> **Filosofia:** Cada fase é independente e pode ser feita em uma feature branch separada.
> Priorizado por **impacto × risco** (alto impacto + baixo risco primeiro).

---

### FASE 1: Foundation — Design System & Shared Utilities
**Prioridade: 🔴 CRÍTICA | Risco: BAIXO | Impacto: MUITO ALTO**

> Criar o alicerce que todas as outras fases dependem.

#### 1.1 — Design Tokens (CSS Custom Properties)
**Arquivo:** `src/styles/tokens.css`

Mover todos os valores hardcoded para CSS variables:
```css
:root {
  /* Colors — já existem parcialmente em index.css */
  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  --color-info: #3b82f6;
  --color-purple: #a855f7;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 14px;
  --radius-pill: 20px;

  /* Typography */
  --font-size-xs: 10px;
  --font-size-sm: 11px;
  --font-size-md: 13px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 20px;
  --font-size-3xl: 24px;
}
```

#### 1.2 — CSS Global Classes
**Arquivo:** `src/styles/components.css`

Substituir os 24 `const inp` e 17 `const lbl` por classes CSS:
```css
/* Inputs */
.os4u-input { ... }
.os4u-input--sm { ... }
.os4u-label { ... }

/* Buttons */
.os4u-btn { ... }
.os4u-btn--primary { ... }
.os4u-btn--danger { ... }
.os4u-btn--ghost { ... }

/* Cards */
.os4u-card { ... }
.os4u-card--kpi { ... }

/* Modal */
.os4u-modal-overlay { ... }
.os4u-modal { ... }
.os4u-modal__header { ... }
.os4u-modal__body { ... }

/* Table */
.os4u-table { ... }
.os4u-table th { ... }
.os4u-table td { ... }

/* Badge */
.os4u-badge { ... }

/* Animations — elimina as 43 duplicações */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.animate-spin { animation: spin 1s linear infinite; }
.animate-pulse { animation: pulse 2s infinite; }
```

#### 1.3 — Shared Types
**Arquivo:** `src/types/index.ts`

Centralizar todas as interfaces que estão espalhadas:
```ts
// Entidades de domínio
export interface Order { id: string; protocol: string; status: OrderStatus; ... }
export interface Client { id: string; name: string; ... }
export interface Product { id: string; name: string; type: 'product' | 'service'; ... }
export interface Transaction { id: string; type: 'INCOME' | 'EXPENSE'; ... }

// Enums / Unions
export type OrderStatus = 'aberta' | 'em_diagnostico' | 'aguardando_aprovacao' | ...;
export type UserRole = 'admin' | 'technician' | 'attendant' | 'super_admin';

// Maps de config
export const STATUS_LABEL: Record<OrderStatus, string> = { ... };
export const STATUS_COLOR: Record<OrderStatus, string> = { ... };
export const PRIORITY_COLOR: Record<string, string> = { ... };
```

#### 1.4 — Shared Utilities
**Arquivo:** `src/utils/format.ts`

```ts
export const formatBRL = (value: number): string => ...;
export const formatDate = (date: string): string => ...;
export const formatDatetime = (date: string): string => ...;
export const today = (): string => ...;
```

**Checklist Fase 1:**
- [ ] Criar `src/styles/tokens.css`
- [ ] Criar `src/styles/components.css`
- [ ] Criar `src/styles/animations.css`
- [ ] Importar novos CSS em `main.tsx`
- [ ] Criar `src/types/index.ts` com todas as interfaces
- [ ] Criar `src/types/enums.ts` com StatusLabel, StatusColor, PriorityColor
- [ ] Criar `src/utils/format.ts` com R$, fmtDate, fmtDatetime
- [ ] Criar `src/utils/constants.ts` com CATEGORIES, PAYMENT_METHODS
- [ ] Remover todas as 43 `<style>` tags de `@keyframes spin`
- [ ] Substituir `const inp` / `const lbl` nos 24+ arquivos por className

---

### FASE 2: Shared UI Components
**Prioridade: 🔴 CRÍTICA | Risco: BAIXO | Impacto: ALTO**

> Extrair componentes reutilizáveis que estão duplicados em múltiplos arquivos.

#### 2.1 — Componentes Base (Atomic)

| Componente | Substitui | Arquivos afetados |
|-----------|-----------|-------------------|
| `<Input />` | 24× `const inp` inline | Todos |
| `<Label />` | 17× `const lbl` inline | Todos |
| `<Button />` | Botões inline com 10+ propriedades | Todos |
| `<Select />` | `<select style={inp}>` | Settings, Finance, Inventory |
| `<Modal />` | Overlay + backdrop inline | Inventory, Finance, Settings, Orders |
| `<Badge />` | StatusBadge, badges inline | Dashboard, Orders, Inventory |
| `<Spinner />` | `<RefreshCw className="animate-spin" />` | 35+ arquivos |
| `<EmptyState />` | Div com ícone + texto centralizado | 10+ arquivos |
| `<KpiCard />` | 2 definições diferentes | Dashboard, Finance |
| `<Toggle />` | Definido em Settings.tsx | Settings |

**Diretório:** `src/components/ui/`

Componentes já existentes em `ui/` que devem ser mantidos:
- `PatternLock.tsx` ✓
- `SmartInput.tsx` ✓
- `ToastContainer.tsx` ✓

Novos componentes a criar:
```
src/components/ui/
├── Badge.tsx
├── Button.tsx
├── Card.tsx
├── EmptyState.tsx
├── Input.tsx
├── KpiCard.tsx
├── Label.tsx
├── Modal.tsx
├── Select.tsx
├── Spinner.tsx
├── Table.tsx
├── Tabs.tsx
├── Toggle.tsx
├── CurrencyInput.tsx      ← mover de Inventory.tsx
├── AutocompleteInput.tsx  ← mover de Inventory.tsx
└── index.ts               ← barrel export (único permitido aqui)
```

#### 2.2 — Componentes Compostos (Molecules)

| Componente | Extrair de |
|-----------|-----------|
| `<StatusBadge />` | Dashboard.tsx, OrderList.tsx |
| `<PriorityBadge />` | Dashboard.tsx |
| `<ConfirmDialog />` | Finance.tsx (delId modal), Inventory.tsx |
| `<FilterBar />` | Inventory, Finance, Clients (padrão comum) |
| `<DateRangePicker />` | Finance, Movimentações |
| `<PageHeader />` | Todas as páginas (ícone + título + descrição + ações) |

**Diretório:** `src/components/shared/`

**Checklist Fase 2:**
- [ ] Criar cada componente em `src/components/ui/`
- [ ] Criar barrel export `src/components/ui/index.ts`
- [ ] Criar componentes compostos em `src/components/shared/`
- [ ] Substituir uso em 1 página piloto (ex: Finance.tsx)
- [ ] Validar visual antes de propagar
- [ ] Propagar para todas as páginas progressivamente
- [ ] Mover `CurrencyInput` e `AutocompleteInput` de Inventory para `ui/`

---

### FASE 3: Component Decomposition (Quebrando God Components)
**Prioridade: 🟡 ALTA | Risco: MÉDIO | Impacto: ALTO**

> Quebrar os arquivos monolíticos seguindo o princípio **1 componente = 1 arquivo**.

#### 3.1 — OrderDetails.tsx (128 KB → ~10 arquivos)

O maior arquivo do projeto. Proposta de decomposição:
```
src/components/orders/
├── OrderDetails.tsx              ← orquestrador principal (~200 linhas)
├── OrderDetailsHeader.tsx        ← cabeçalho com protocolo, status, ações
├── OrderDetailsTimeline.tsx      ← timeline de status
├── OrderEquipmentTab.tsx         ← (já existe)
├── OrderFinancialTab.tsx         ← (já existe)
├── OrderPartsTab.tsx             ← (já existe)
├── OrderPhotosTab.tsx            ← (já existe)
├── ConversationTab.tsx           ← (já existe)
├── QuoteTab.tsx                  ← (já existe)
└── OrderDetailsModals.tsx        ← todos os modais agrupados
```

#### 3.2 — Inventory.tsx (67 KB → 5 arquivos)

```
src/pages/Inventory.tsx              ← orquestrador (~300 linhas)
src/components/inventory/
├── ProductModal.tsx                 ← (já existe, popular com o código inline)
├── StockAdjustmentModal.tsx         ← (já existe)
├── InventoryTable.tsx               ← (novo)
├── InventoryKpis.tsx                ← (novo)
├── InventoryAlerts.tsx              ← (novo)
├── AbcCurveView.tsx                 ← (novo)
└── MovementsView.tsx                ← (novo)
```

#### 3.3 — Settings.tsx (62 KB → já parcialmente decomposto)

O Settings.tsx já importa componentes de `settings/`, mas ainda tem inline:
- `FinanceConfigSettings` → mover para `settings/FinanceConfigSettings.tsx`
- `CustomizationSettings` → mover para `settings/CustomizationSettings.tsx`
- `Toggle` → mover para `ui/Toggle.tsx`
- WhatsApp render → já em arquivo separado? Verificar, se não, extrair
- Users render → mover para `settings/UsersSettings.tsx`

#### 3.4 — Finance.tsx (49 KB → 4 arquivos)

```
src/pages/Finance.tsx               ← orquestrador (~200 linhas)
src/components/finance/
├── FinanceSummary.tsx               ← (já existe)
├── TransactionModal.tsx             ← (já existe)
├── TransactionTable.tsx             ← (novo)
├── DreView.tsx                      ← (novo)
├── CategoryBreakdown.tsx            ← (novo)
└── UpcomingPayments.tsx             ← (novo)
```

#### 3.5 — Dashboard.tsx (34 KB → 4 arquivos)

```
src/pages/Dashboard.tsx              ← orquestrador (~150 linhas)
src/components/dashboard/
├── DashboardKpis.tsx                ← KPIs row
├── DashboardPipeline.tsx            ← Funil de status
├── DashboardRevenue.tsx             ← Gráfico 7 dias
├── DashboardSlaAlerts.tsx           ← SLA em risco
└── DashboardRecentOrders.tsx        ← Tabela de ordens recentes
```

**Checklist Fase 3:**
- [ ] Decompor `OrderDetails.tsx` (prioridade máxima — 128 KB)
- [ ] Decompor `Inventory.tsx`
- [ ] Extrair componentes inline do `Settings.tsx`
- [ ] Decompor `Finance.tsx`
- [ ] Decompor `Dashboard.tsx`
- [ ] Decompor `Warranty.tsx`
- [ ] Decompor `LandingPage.tsx`
- [ ] Decompor `Fiscal.tsx`
- [ ] Remover `components/Layout.tsx` (legacy)
- [ ] Garantir que nenhum arquivo de componente ultrapasse 400 linhas

---

### FASE 4: Performance — Lazy Loading & Memoization
**Prioridade: 🟡 ALTA | Risco: BAIXO | Impacto: ALTO**

> Implementar code splitting e otimizações de re-render.

#### 4.1 — React.lazy + Suspense

**Arquivo:** `src/App.tsx`

Todas as páginas devem ser carregadas via `React.lazy()`:
```tsx
// ANTES (atual)
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';

// DEPOIS
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));

// Wrapper com fallback
<Suspense fallback={<PageLoader />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Suspense>
```

**Prioridade de lazy loading:**
1. **Admin SaaS pages** (99% dos usuários nunca acessa)
2. **Settings** (acesso raro)
3. **Reports** (acesso eventual)
4. **Diagnostic/Board pages** (acesso raro)
5. **Modais pesados** (OrderDetails, ProductModal)

#### 4.2 — React.memo nos Componentes Certos

Candidatos para `React.memo`:
- `KpiCard` — props primitivas, re-render frequente
- `StatusBadge` — props string, puro
- `Badge` — props primitivas
- `Table rows` — listas grandes
- `Sidebar links` — nunca mudam durante interação
- `MiniBarChart` — dados mudam raramente

#### 4.3 — useMemo / useCallback

Padrões a otimizar:
```tsx
// ANTES — recalcula a cada render
const filtered = products.filter(p => ...);

// DEPOIS
const filtered = useMemo(
  () => products.filter(p => ...),
  [products, search, filterType]
);
```

#### 4.4 — useMediaQuery Hook (substituir window.innerWidth)

Criar `src/hooks/useMediaQuery.ts`:
```tsx
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
};

// Uso
const isMobile = useMediaQuery('(max-width: 767px)');
```

**Checklist Fase 4:**
- [ ] Implementar `React.lazy()` para todas as rotas em `App.tsx`
- [ ] Criar `PageLoader` component (skeleton/spinner)
- [ ] Adicionar `<Suspense>` boundaries
- [ ] Aplicar `React.memo` nos componentes listados
- [ ] Criar `useMediaQuery` hook
- [ ] Substituir `window.innerWidth` em Dashboard, Settings, AppLayout
- [ ] Adicionar `useMemo` para listas filtradas (Inventory, Finance, Clients)
- [ ] Adicionar `useCallback` para handlers que são passados como props

---

### FASE 5: TypeScript Strictness
**Prioridade: 🟡 MÉDIA | Risco: BAIXO | Impacto: MÉDIO**

> Eliminar os 162 usos de `any` e fortalecer tipagem.

#### 5.1 — Substituição Gradual de `any`

| Padrão atual | Substituto |
|-------------|-----------|
| `(e: any)` em catch | `(e: unknown)` ou `(e: Error)` |
| `(product as any)?.ncm` | Estender a interface `Product` |
| `r.data.forEach((s: any) => ...)` | Tipar resposta da API |
| `setState(p => ({ ...p, [k]: v } as any))` | Tipar o estado |
| `useRef<any>` | Tipar referência correta |

#### 5.2 — API Response Types

Criar types para todas as respostas de API:
```ts
// src/types/api.ts
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
}
```

#### 5.3 — Configuração do TSConfig

Considerar ativar gradualmente:
```json
{
  "compilerOptions": {
    "noImplicitAny": true,         // Fase final
    "strictNullChecks": true,       // Após types estáveis
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Checklist Fase 5:**
- [ ] Criar `src/types/api.ts`
- [ ] Estender interfaces existentes em `src/types/index.ts`
- [ ] Substituir `any` em catch blocks (global find/replace seguro)
- [ ] Substituir `any` em API responses (arquivo por arquivo)
- [ ] Eliminar `as any` casts
- [ ] Ativar `noImplicitAny` no tsconfig

---

### FASE 6: Architecture & Best Practices
**Prioridade: 🟢 BAIXA | Risco: MÉDIO | Impacto: MÉDIO**

> Melhorias estruturais e de arquitetura.

#### 6.1 — Error Boundaries por Seção

```
<ErrorBoundary fallback={<ErrorPage section="orders" />}>
  <Suspense fallback={<PageLoader />}>
    <Route path="/orders" element={<Orders />} />
  </Suspense>
</ErrorBoundary>
```

#### 6.2 — Custom Hooks Adicionais

| Hook | Propósito |
|------|----------|
| `useApi<T>()` | Fetch genérico com loading/error/data |
| `useMediaQuery()` | Substituir window.innerWidth | 
| `useDebounce()` | Substituir setTimeout em buscas |
| `useLocalStorage()` | Persistência tipada |
| `useConfirmDialog()` | Modal de confirmação padronizado |

#### 6.3 — Remover Código Morto

- [ ] Remover `src/components/Layout.tsx` (legacy, substituído por AppLayout)
- [ ] Remover `src/pages/DebugAuth.tsx` (ferramenta de debug)
- [ ] Auditar `MasterLayout.tsx` — em uso ou substituído?

#### 6.4 — ESLint Custom Rules

Adicionar regras ao `eslint.config.js`:
```js
rules: {
  'no-inline-styles': 'warn',              // Custom
  '@typescript-eslint/no-explicit-any': 'warn',
  'react/no-array-index-key': 'warn',
  'react/jsx-no-bind': ['warn', { allowArrowFunctions: false }],
}
```

#### 6.5 — Reestruturação de Diretórios (Opcional)

Proposta de reorganização final:
```
src/
├── assets/
├── components/
│   ├── ui/           ← Atomic components (Button, Input, Modal...)
│   ├── shared/       ← Molecules (PageHeader, FilterBar, ConfirmDialog...)
│   ├── dashboard/
│   ├── orders/
│   ├── inventory/
│   ├── finance/
│   ├── settings/
│   ├── fiscal/
│   └── ...
├── context/
├── hooks/
├── layout/           ← AppLayout, Sidebar, Topbar, BottomNav
├── pages/            ← Apenas orquestradores (< 300 linhas cada)
├── services/
├── styles/           ← tokens.css, components.css, animations.css
├── types/            ← Interfaces, enums, API types
├── utils/            ← format.ts, constants.ts, validation.ts
├── admin/            ← SaaS admin pages
├── App.tsx
└── main.tsx
```

---

### FASE 7: Logger Service — Centralização de Logs
**Prioridade: 🟡 MÉDIA | Risco: BAIXO | Impacto: MÉDIO**

> Substituir todos os `console.log`, `console.error` e `alert()` por um serviço centralizado com controle de ambiente.

#### Diagnóstico Atual

| Tipo de log | Ocorrências | Arquivos afetados |
|-------------|-------------|-------------------|
| `console.log()` | 5 | 4 arquivos (AuthContext, MasterLogin, OrderForm, OrderDetails) |
| `console.error()` | 50+ | 38 arquivos (pages, components, hooks, admin) |
| `console.warn()` | 0 | — |
| `console.info()` | 0 | — |
| `alert()` nativo | 35+ | 35 arquivos (erro/sucesso mostrado via `alert()`) |
| **Total** | **~90+** | **42 arquivos únicos** |

**Problemas identificados:**
- Logs de debug em produção (`console.log('[Auth] Carregando usuário...')`)
- Erros silenciados (`catch { }` ou `catch (e) { console.error(e) }` sem feedback ao usuário)
- `alert()` usado como mecanismo de notificação — bloqueia UI, não é estilizável
- Sem padronização de formato (mistura de `[Frontend]`, `[Auth]`, `[MasterLogin]`, strings soltas)
- Sem mecanismo para desabilitar logs em produção
- Sem capacidade de enviar logs críticos para serviço externo (ex: Sentry, LogRocket)

#### 7.1 — Criar Logger Service

**Arquivo:** `src/services/logger.ts`

```ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Em produção: apenas warn + error
// Em dev: tudo
const MIN_LEVEL: LogLevel = import.meta.env.PROD ? 'warn' : 'debug';

class Logger {
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
  }

  private format(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      module: this.module,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private emit(entry: LogEntry): void {
    const prefix = `[${entry.module}]`;
    switch (entry.level) {
      case 'debug': console.debug(prefix, entry.message, entry.data ?? ''); break;
      case 'info':  console.info(prefix, entry.message, entry.data ?? '');  break;
      case 'warn':  console.warn(prefix, entry.message, entry.data ?? '');  break;
      case 'error': console.error(prefix, entry.message, entry.data ?? ''); break;
    }

    // Hook para envio externo (Sentry, LogRocket, etc.) — futuro
    if (entry.level === 'error') {
      // reportToExternalService(entry);
    }
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) this.emit(this.format('debug', message, data));
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) this.emit(this.format('info', message, data));
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) this.emit(this.format('warn', message, data));
  }

  error(message: string, data?: unknown): void {
    if (this.shouldLog('error')) this.emit(this.format('error', message, data));
  }
}

// Factory — um logger por módulo
export const createLogger = (module: string): Logger => new Logger(module);

// Logger padrão para uso rápido
export const logger = createLogger('App');
```

**Uso:**
```tsx
// ANTES
console.log('[Auth] Carregando usuário persistido:', parsedUser.email);
console.error('Error creating order:', error);
alert('Erro ao salvar.');

// DEPOIS
import { createLogger } from '../services/logger';
const log = createLogger('Auth');

log.debug('Carregando usuário persistido', { email: parsedUser.email });
log.error('Error creating order', error);
toast.error('Erro ao salvar.');
```

#### 7.2 — Substituir `alert()` por Toast

O projeto já possui `useToast` hook e `ToastContainer` componente. Substituir todos os `alert()` nativos:

| Padrão atual | Substituto |
|-------------|------------|
| `alert('Erro ao salvar.')` | `toast.error('Erro ao salvar.')` |
| `alert('Senha alterada com sucesso!')` | `toast.success('Senha alterada!')` |
| `alert(\`Senha temporária: \${r.data.tempPassword}\`)` | Modal customizado ou toast com copy |
| `if (!confirm('Excluir?')) return` | `useConfirmDialog()` (Fase 6) |

#### 7.3 — Substituição por Módulo (Prioridade)

| Módulo | `console.*` | `alert()` | Prioridade |
|--------|------------|-----------|------------|
| `components/orders/` (OrderDetails, OrderForm, etc.) | 18 | 8 | 🔴 Alta |
| `pages/` (Finance, Inventory, Settings, etc.) | 15 | 15 | 🔴 Alta |
| `context/AuthContext.tsx` | 1 | 0 | 🟡 Média |
| `components/settings/` | 3 | 1 | 🟡 Média |
| `components/inventory/` | 3 | 2 | 🟡 Média |
| `admin/pages/` | 6 | 2 | 🟢 Baixa |
| `hooks/` | 1 | 0 | 🟢 Baixa |
| `components/board-diagnosis/` | 3 | 0 | 🟢 Baixa |

#### 7.4 — ESLint Rule: Proibir `console.*` Direto

Adicionar ao `eslint.config.js`:
```js
rules: {
  'no-console': ['warn', {
    allow: [] // Nenhum console.* permitido diretamente
  }],
}
```

Isso garante que novos `console.log` não sejam introduzidos após a migração.

> **Nota:** O `logger.ts` é o único arquivo autorizado a usar `console.*` internamente — adicionar `// eslint-disable-next-line no-console` nos 4 pontos do `emit()`.

#### 7.5 — Benefícios Esperados

- **Zero logs de debug em produção** — `MIN_LEVEL = 'warn'` em prod
- **Formato padronizado** — `[Module] message` em todo o app
- **Preparado para integração externa** — hook de `reportToExternalService()` pronto
- **Melhor UX** — `alert()` substituído por toast não-bloqueante
- **Auditabilidade** — possibilidade de persistir logs em `localStorage` para suporte
- **ESLint enforcement** — impossível introduzir `console.log` acidentalmente

**Checklist Fase 7:**
- [ ] Criar `src/services/logger.ts`
- [ ] Substituir `console.log` nos 4 arquivos (AuthContext, MasterLogin, OrderForm, OrderDetails)
- [ ] Substituir `console.error` nos 38 arquivos — priorizar `orders/` e `pages/`
- [ ] Substituir `alert()` por `toast.*` nos 35 arquivos
- [ ] Substituir `confirm()` por `useConfirmDialog` (depende da Fase 6)
- [ ] Adicionar regra `no-console: warn` no ESLint
- [ ] Adicionar `eslint-disable` no `logger.ts` (único ponto autorizado)
- [ ] Verificar que em build de produção nenhum log de debug aparece
- [ ] Testar toast notifications em mobile e desktop

---

## 📅 Timeline Sugerida

| Fase | Estimativa | Dependências | Branch |
|------|-----------|-------------|--------|
| **Fase 1** — Foundation | 2-3 dias | Nenhuma | `feature/design-system` |
| **Fase 2** — UI Components | 3-4 dias | Fase 1 | `feature/shared-components` |
| **Fase 3** — Decomposition | 5-7 dias | Fase 1 + 2 | `feature/decompose-pages` |
| **Fase 4** — Performance | 2-3 dias | Fase 1 | `feature/performance` |
| **Fase 5** — TypeScript | 3-4 dias | Fase 1 + 3 | `feature/strict-types` |
| **Fase 6** — Architecture | 2-3 dias | Fase 1-4 | `feature/architecture` |
| **Fase 7** — Logger Service | 2-3 dias | Fase 2 (Toast) | `feature/logger-service` |
| **Total** | **~19-27 dias** | | |

---

## ⚠️ Regras de Execução

1. **Nunca quebrar funcionalidade existente** — cada mudança deve manter o comportamento visual e funcional idêntico
2. **Feature branch por fase** — `feature/design-system`, `feature/shared-components`, etc.
3. **Nunca commitar direto na `main`** — sempre via `develop` → PR → `main`
4. **Teste visual antes e depois** — comparar screenshots para garantir pixel-perfect
5. **Fases 1 e 2 podem rodar em paralelo** — tokens + components são independentes
6. **Fase 3 depende de Fase 1 e 2** — decomposição usa os novos componentes

---

## 📎 Referências

- [`AGENTS.md`](./AGENTS.md) — Guia universal do projeto
- [`docs/frontend/frontend_architecture.md`](./docs/frontend/frontend_architecture.md) — Arquitetura frontend atual
- [`docs/frontend/frontend_structure.md`](./docs/frontend/frontend_structure.md) — Estrutura React
- [Vercel React Best Practices](./.agents/skills/vercel-react-best-practices/SKILL.md) — Guidelines de performance

---

*Este plano é um documento vivo. Atualizar conforme as fases forem concluídas.*
