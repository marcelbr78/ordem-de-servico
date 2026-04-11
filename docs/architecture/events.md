# Event Architecture

The application relies on asynchronous, decoupled message passing via `EventEmitter2` to build ML models, capture audit trails, and fire webhooks without bottlenecking the primary HTTP request lifecycle.

## Core Events

### `work_order.created`

- **Trigger**: Fired when a new Work Order is saved in the database.
- **Payload**: Contains the newly created OS details and tenant metadata.
- **Listeners**: Client notification dispatchers.

### `work_order.status_changed` (AppEvent.WORK_ORDER_STATUS_CHANGED)

- **Trigger**: Fired when an OS moves from one status to another (e.g., `EM_REPARO` -> `FINALIZADA`).
- **Payload**: `{ orderId, oldStatus, newStatus, tenantId }`

## Smart Module Listeners

The predictive engine operates purely on `status_changed` events, specifically scanning for when an OS indicates the repair cycle is successfully concluded (`FINALIZADA` or `ENTREGUE`).

### `SmartDiagnosticsListener`

- **Action**: Intercepts completed orders. Reads the `model`, `symptom`, and final `diagnosis`.
- **Result**: Upserts `diagnostic_patterns`. Increments the `frequency` integer so the AI learns which diagnoses are most common for the given inputs.

### `SmartPricingListener`

- **Action**: Intercepts completed orders. Reads the `finalValue` and the calculated duration of the repair.
- **Result**: Evaluates the `repair_price_patterns` matrix. Recalculates the moving average (`avg_price`), updates global min/max boundaries, and averages the repair time.
