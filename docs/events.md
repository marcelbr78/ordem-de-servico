# Event System Documentation

To maintain decoupled architecture and increase the resilience of operations across diverse sub-modules, the system orchestrates cross-boundary communication using an Event-Driven architecture inside the NestJS framework.

## Event Dispatcher Configuration

- **File**: `modules/events/event-dispatcher.service.ts`
- **Mechanism**: The backend leverages a centralized `EventEmitter2` instance that propagates specific data payloads to targeted listeners.

## Registered System Events (`AppEvent`)

Defined in `event-types.ts`.

### 1. `AppEvent.WORK_ORDER_CREATED`

* **Emitted By**: `OrdersService.create()` upon a completely successful OS creation cycle (including database commits and protocol generation).
- **Payload**: `orderId`, `protocol`, `clientId`, `technicianId`, `tenantId`, `userId`, `timestamp`.
- **Primary Listeners**:
  - **WhatsAppListener (`whatsapp.listener.ts`)**: Evaluates store messaging configurations. Automatically builds the "OS ABERTA" notification prompt bridging the store name and client details, pushing it via Evolution API.

### 2. `AppEvent.WORK_ORDER_STATUS_CHANGED`

* **Emitted By**: `OrdersService.changeStatus()` after securely committing the new state (e.g., `EM_REPARO` to `FINALIZADA`), triggering stock deductions/financial inputs successfully.
- **Payload**: `orderId`, `protocol`, `previousStatus`, `newStatus`, `comments`, `tenantId`, `userId`, `timestamp`.
- **Primary Listeners**:
  - **WhatsAppListener`: Listens for transition conditions (especially completion paths like`ENTREGUE` or `FINALIZADA`). Distributes automated dynamic responses (`✅ SERVIÇO CONCLUÍDO`) appending the current OS balance and last diagnostic notes via API delivery.

### 3. `AppEvent.USER_CREATED` (Hypothetical Core Expansion)

* Expected to manage future integrations where new technician onboarding fires off system orientation sequences via external modules.

### Benefits

By strictly divorcing the `OrdersService` creation logic from third-party networks (WhatsApp Evolution API logic), the workflow avoids total breakdown sequences (OS creation failures) if external API channels time out. They fire synchronously under transaction commits, delegating execution tracking.
