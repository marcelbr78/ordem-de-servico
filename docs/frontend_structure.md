# Frontend Architecture

The web interface is a modern single-page application built on React, specifically leveraging Vite for high-performance HMR and optimized production bundles. State management primarily delegates to contextual boundaries, with routing controlled securely by `react-router-dom`.

## Main Modules

### Core Work Order System

- Manages the primary `/dashboard` and `/orders` lifecycles for the isolated tenants.
- Integrates glassmorphic UI components.
- Tracks granular operations (adding products, updating service values, taking photos of the equipment).

### Smart Assistant Panel

- A proactive UI intelligence layer specifically embedded in `OrderForm.tsx`.
- Passively monitors the technician's keystrokes.
- Uses a `500ms` debounce mapped to an internal memory cache.
- When `model.length > 2 && symptom.length > 3`, it dynamically surfaces the Top 3 Diagnoses, Top 5 Suggested Hardware Parts, and historically averaged Pricing constraints.
- Operates totally isolated as an informative overlay; it never forcefully edits the core OS metadata.

## Admin SaaS Panel Routes

The super administrator namespace is split from the tenant dashboards into a segregated layout (`MasterLayout`) for platform oversight:

### Routes

- `/portal-gestao/acesso` - Dedicated master admin login.
- `/portal-gestao/inicio` - Core `MasterDashboard` rendering MRR and tenant distribution metrics.
- `/masteradmin/tenants` - Tenant provision and life-cycle management UI.
- `/masteradmin/billing` - Subscription control interface.
