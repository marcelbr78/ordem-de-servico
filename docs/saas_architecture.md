# SaaS Architecture

## Multi-Tenant Isolation

The platform implements a strict multi-tenant architecture to support isolated SaaS interactions where multiple stores and franchises operate within the same physical instance without data crossing.

### TenantMiddleware

All API requests (except specifically excluded prefixes) pass through this guard. It extracts the authentication payload and implicitly injects the `tenantId` into the request scope. The application repositories uniformly leverage this scoped ID to automatically filter reads and writes. No cross-tenant aggregations are possible by default.

## Global Administration

To manage the overarching SaaS configurations, subscriptions, and MRR, a high-level administrative layer sits totally external to the Tenant logic.

### Admin Routes Isolation

Routes prefixed with `/admin/*` are explicitly excluded from the `TenantMiddleware`. These controllers interact sequentially with global platform services (e.g., retrieving all active platform tenants regardless of ID).

### SuperAdminGuard

An aggressive secondary layer of protection on all `/admin` routes. It ensures that the current JWT context possesses the `super_admin` role. If a traditional user attempts to hit a platform configuration endpoint, the guard aggressively drops the request as a 403 Forbidden.

## MRR Calculation

The platform actively calculates Monthly Recurring Revenue (`Active MRR`) by summing the pricing values of all system Subscriptions where the status evaluates strictly to `ACTIVE`. If a subscription churns or is disabled, its financial footprint is immediately extracted from the live MRR dashboard.
