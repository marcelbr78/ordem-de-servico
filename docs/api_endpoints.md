# API Endpoints

The API is structured around RESTful principles. Almost all endpoints (except registration/login) require a valid JWT issued by the `AuthService` through the `JwtAuthGuard`.

## Headers

* `Authorization`: `Bearer <jwt_token>`
* `Content-Type`: `application/json`

---

## Auth (`/auth`)

* `POST /auth/login`: Authenticates user (`email`, `password`) and issues a JWT token containing their `sub` (userId), `role`, and `tenantId`.
* `POST /auth/refresh`: Renews an expired access token using a valid refresh token.
* `POST /auth/logout`: Invalidates the current user session/refresh token.

---

## Multi-Tenant SaaS (`/tenants`)

* `GET /tenants`: Lists all stores/tenants in the system. Requires `Permission.SAAS_MANAGE`.
* `POST /tenants/register`: Onboards a new store. Provisions the tenant record, the primary admin user with an 8-character password, a `Subscription` (default to Trial), and scaffolding the SQLite isolation database.
* `PATCH /tenants/:id/suspend`: Marks a store as suspended.

## Plans (`/plans`)

* `GET /plans`: List available subscription plans and prices.
* `POST /plans/subscription/:tenantId/:planId`: Subscribes a tenant to a paid plan.
* `PATCH /plans/subscription/:tenantId/upgrade/:planId`: Modifies the store's current usage limits based on their new subscription tier.

---

## Order Services (`/orders`)

* `POST /orders`: Creates a new work order. Required parameters: `clientId`, `equipments`, `priority`.
* `GET /orders`: Retrieves all OS for the authenticated user's `tenantId`.
* `GET /orders/:id`: Retrieves detailed info of a specific OS (client, equipment, parts, photo timeline, history logs).
* `PATCH /orders/:id/status`: Advances the OS workflow status (`dto.status`). Triggers backend validations, stock consumption (if `FINALIZADA`), financial entries (if `ENTREGUE`), and emits event `WORK_ORDER_STATUS_CHANGED`.
* `POST /orders/:id/images`: Uploads diagnostic images to Cloudinary and links them to the active OS context.
* `POST /orders/:id/share`: Manually dispatches a WhatsApp notification bridging external context via the Evolution API module.

---

## Clients (`/clients`)

* `POST /clients`: Registers a new client entry to the store.
* `GET /clients`: Retrieves CRM list.

---

## Inventory (`/products`)

* `GET /products`: Fetches parts list.
* `POST /products`: Registers components, enabling stock metrics (`StockMovements`).

---

## WhatsApp Setup (`/whatsapp`)

* `POST /whatsapp/config`: Saves store-specific API keys and Evolution Instance Names into their specialized configuration structure.
* `GET /whatsapp/status`: Check connection bounds of current `tenantId` session.
