# API Endpoints

## Core API

### Orders API

- `POST /orders` - Create a new work order.
- `GET /orders` - List tenant orders.
- `GET /orders/:id` - Get order details.
- `PATCH /orders/:id` - Update order fields.
- `POST /orders/:id/status` - Transition order status (triggers events).
- `POST /orders/:id/parts` - Add parts to an order.

### Quotes API (SmartParts Integration)

- `POST /smart-parts/quotes` - Initiate a new part quote broadcast via WhatsApp.
- `GET /smart-parts/quotes/:orderId` - Get active quotes for an order.
- `POST /smart-parts/webhook/whatsapp` - Inbound listener for supplier pricing responses.
- `POST /smart-parts/quotes/:id/approve` - Approve a quote, creating a product and stock entry.

### Inventory API

- `GET /inventory/products` - List available products.
- `POST /inventory/products` - Manually create a new product.
- `GET /inventory/balance` - View stock levels.

---

## Admin SaaS API

*These routes are strictly decoupled from tenant isolation and require a `super_admin` JWT token.*

- `GET /admin/dashboard` - Returns global platform metrics (Active MRR, Churn rate, total tenants).
- `GET /admin/tenants` - Lists all registered platform tenants (supports `?page=x&limit=y`).
- `PATCH /admin/tenants/:id` - Toggle tenant active state or update platform configuration.
- `GET /admin/plans` - List available SaaS subscription plans.
- `PATCH /admin/subscriptions/:tenantId` - Modify a tenant's active subscription (change `planId`).

---

## Smart Modules (AI Assistant)

*These endpoints aggregate massive historical datasets scoped down natively to the requesting `tenantId`.*

- `GET /smart-diagnostics/suggestions?model=X&symptom=Y`
  - Returns the Top 3 most statistically probable diagnoses.
- `GET /smart-pricing/suggestion?model=X&symptom=Y`
  - Returns historical `avg_price`, `min_price`, `max_price`, and `avg_repair_time`.
- `GET /smart-parts/suggestions?model=X&symptom=Y&diagnosis=Z`
  - Dynamically builds a QueryBuilder against the Quotes history to return the Top 5 most frequently used hardware parts for the specific scenario.
