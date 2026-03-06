# Backend Architecture

The backend is developed with **NestJS**, utilizing a modular architecture for scalability and clean separation of concerns.

## Core ERP Modules (`src/modules/`)

- **Orders**: Management of technical service orders (status tracking, technician assignments).
- **Inventory**: Product management, stock movements, and low-stock alerts.
- **Quotes**: Budgeting and customer approval workflows.
- **Smart-Diagnostics**: Logic for processed diagnostics and hardware analysis.
- **Smart-Pricing**: Dynamic labor cost and part margin calculations.
- **Smart-Parts**: Supplier integration for bulk quoting and parts procurement.

## Platform Admin Modules (`src/admin/`)

- **Dashboard**: Aggregation logic for platform-wide metrics (MRR, Tenant Growth, Churn).
- **Tenants/Plans/Subscriptions**: Entities and services managing the SaaS business logic and multi-tenant registration.

## Multi-Tenancy Engine

The system implements multi-tenancy through **logical isolation**, where a `tenant_id` is required across services to filter and protect customer data effectively. It also supports database-level isolation for critical operations.
