# SaaS Architecture

## Multitenancy Model

The system is built on a "Database-per-Tenant" conceptual framework.

### Global Store (Master Level)

Administered statically. Manages onboarding, security validation (JWT context mapping), and billing orchestration.

- **Tenant Management**: Tracks unique CNPJ identifiers, store names, and administrative owners.
- **Authentication Gateway**: All user requests enter through a master gateway that decrypts user credentials and identifies their mapped `tenantId`.

### Workload Isolation (`tenant_<uuid>.sqlite`)

Post-Registration, the system provisions an independent SQLite container per client store.
This physical separation guarantees absolute isolation of sensitive store data (orders, stock metrics, financial registers) from unrelated clients.

## Subscription and Resource Enforcement

Each Tenant holds a singular relation to a `Subscription` model, enforcing resource limits defined exclusively by their `Plan`.

### 1. Limits Management (`plans.service.ts`)

The `PlansService` evaluates resource constraints during operational bounds (e.g., Opening a new Work Order or creating a new technician User).

#### Flow of Enforcement

- **Query**: Before an OS is logged, `checkOsLimit(tenantId)` validates current usage.
- **Threshold Matching**: `PlansService` reads the active subscription associated with the tenant.
- **Circuit Breaker**: If the tenant exceeds their ceiling limits (`osLimit` or `usersLimit` configured within `plans` table), the request is abruptly rejected, throwing an HTTP `ForbiddenException` enforcing upgrade prompts.
- Unlimited plans operate silently bypassing numeric boundary scans (i.e. if limit === `0`).

### 2. Immediate Provisioning

New platform signups systematically bypass complex onboarding structures by invoking default configurations logic:

- A `Trial` (or `Free`) Plan structurally generates in the `Plans` manifest if entirely devoid within the environment.
- A 14-day trailing cycle actively attaches onto the default admin context seamlessly.
