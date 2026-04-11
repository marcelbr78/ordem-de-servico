# Database Schema

## Multi-Tenant Architecture

The database enforces strict logical separation of data via the `tenantId` column. Almost every operational entity belongs to a specific tenant. Queries executed by the standard application payload are automatically scoped to the user's `tenantId` by the `TenantMiddleware`, ensuring absolute SaaS data isolation.

## Core Tables

### SaaS Administration

- **`tenants`**: Defines the isolated store environments. Contains branding, active flags, and API configurations.
- **`plans`**: Defines the available SaaS subscription tiers, costs, and feature limits.
- **`subscriptions`**: Maps a Tenant to a Plan. Tracks the billing cycle, subscription status (`ACTIVE`, `OVERDUE`), and payment history.

### Workflow & Operations

- **`orders` (`order_services`)**: The primary Work Order entity. Tracks protocol numbers, technical reports, statuses (e.g., `EM_DIAGNOSTICO`, `FINALIZADA`), and total values.
- **`order_history`**: Audit trail of every status transition and note appended to an Order.
- **`order_equipments`**: The physical device associated with an order (brand, model, serial, reported defect).
- **`order_parts`**: Finalized components applied to an order, affecting inventory.

### Parts & Quoting

- **`quotes` (`smartparts_quotes`)**: Represents an active vendor inquiry for a specific part needed in an Order. Stores `bestPrice` and `status`.
- **`quote_responses`**: Bids received from suppliers via the WhatsApp webhook for a specific Quote.
- **`suppliers`**: Vendors registered to receive automated quote requests.

### Inventory

- **`products`**: The master list of distinct parts and items available or previously purchased.
- **`stock_balances`**: Tracks current physical quantities of products.
- **`stock_movements`**: Ledger of all IN/OUT operations affecting stock balances.

### Smart Patterns

- **`diagnostic_patterns`**: Stores aggregated frequency metrics linking `model` and `symptom` to a specific `diagnosis`.
- **`repair_price_patterns`**: Stores historical cost boundaries (`min_price`, `max_price`, `avg_price`) for specific repairs.
- *(Note: Smart Parts evaluates history dynamically against `quotes` rather than maintaining a separate table).*
