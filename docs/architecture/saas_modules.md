# SaaS Modules & Multi-Tenancy Logic

The system is designed as a **SaaS platform** supporting a large number of independent technical assistance stores.

## Key Logic Components

- **Tenants**: Independent entities representing each technical assistance shop.
- **Subscriptions**: The lifecycle of a tenant's billing (Trial, Active, Past Due, Suspended).
- **Plans (SaaS Tiers)**:
  - **Starter**: 50 orders/month, 2 users, 50 inventory items.
  - **Professional**: 500 orders/month, 10 users, 500 inventory items.
  - **Enterprise**: All limits configurable, unlimited data.

## Features

- **Resource Limits**: Real-time enforcement of the plan (orders, users, storage).
- **Trial Logic**: Automated 14-day trial for new signups.
- **Onboarding**: Self-signup workflow with automated tenant and admin user creation.
- **Impersonation**: Super Admin tool to debug specific tenant issues by viewing their context (Read-only or Debug modes).
- **Status Badges**: Visual indicators (🟢 Active, 🟡 Trial, 🔴 Suspended) for immediate management.
