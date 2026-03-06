# System Architecture

## Project Overview

The "Ordem de serviço" application is a multi-tenant SaaS platform built for technical assistance and repair shops. It provides an end-to-end solution for managing work orders (OS), inventory, clients, finances, and WhatsApp communications, all isolated by tenant.

## Tech Stack

* **Backend**: NestJS, TypeScript, TypeORM (SQLite per tenant), Passport (JWT)
* **Frontend**: React, Next.js / Vite, TypeScript, TailwindCSS
* **Integrations**: Evolution API (WhatsApp), Cloudinary (Images)

## Folder Structure

```
/backend
  ├── /src
  │    ├── /modules        # Feature modules
  │    │    ├── /auth      # Authentication
  │    │    ├── /users     # User management
  │    │    ├── /tenants   # SaaS Multi-tenancy
  │    │    ├── /orders    # Work order lifecycle
  │    │    ├── /clients   # Client CRM
  │    │    ├── /events    # Event-driven system
  │    │    ├── /whatsapp  # Evolution API integration
  │    │    └── ...
  │    ├── /common         # Guards, Decorators, Filters
  │    └── main.ts         # Entry point
/frontend
  ├── /src
  │    ├── /pages          # React views
  │    ├── /components     # Reuseable UI components
  │    ├── /hooks          # Custom React hooks
  │    └── /services       # API connectivity
```

## Core Modules & Entities

* **Tenants Module**: Orchestrates SaaS operations (`Tenant`, `Plan`, `Subscription`). Registers stores and creates isolated SQLite databases.
* **Orders Module**: Manages the core business flow (`OrderService`, `OrderEquipment`, `OrderHistory`, `OrderPhoto`, `OrderPart`).
* **Auth Module**: Handles JWT issuance, validation, and role-based access logic (`User`, `UserRole`). Maps user credentials to specific `tenantId`.
* **Events Module**: Centralized dispatcher (`EventDispatcher`, `AppEvent`) enabling reactive architecture (e.g., triggering WhatsApp on OS updates without tightly coupling the code).

## Authentication Flow & Tenant Handling

1. **Login**: User submits credentials.
2. **Validation**: The system queries the master user database and validates the password.
3. **JWT Issuance**: `AuthService` encodes the user's ID, role, and strictly maps their `tenantId` into the token payload.
4. **Execution**: Incoming API requests pass through `JwtAuthGuard`, which extracts the JWT and populates `req.user.tenantId`.
5. **Data Isolation**: Services filter operations based on this `tenantId`, ensuring absolute isolation of data across different stores.

## Event System

The application leverages a lightweight event emitter to decouple processes.
For example, the `work_order.created` event is fired when a new OS is logged. Asynchronous listeners (like the `WhatsAppListener`) hear this event and independently trigger messaging flows without blocking the primary HTTP response.
