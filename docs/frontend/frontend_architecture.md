# Frontend Architecture

The frontend is built using **React** with **Vite**, featuring a modern "Glassmorphism" UI design system optimized for both desktop and PWA (Mobile) usage.

## Layout Structure

The application uses a unified layout system located in `src/layout/`:

- **AppLayout**: The primary wrapper managing the Sidebar, Topbar, and Content area.
- **Sidebar**: A dynamic, collapsible navigation menu with sections for both the Store (Main System) and the Platform SaaS (Admin).
- **Topbar**: Fixed top bar featuring user profile, notifications, and the **Global Search** engine.

## Core Admin SaaS Pages (`src/admin/pages/`)

- **PlatformOverview**: The master executive dashboard with real-time MRR charts, churn metrics, and revenue forecasts.
- **TenantsPage**: Management list of all registered stores with status badges and filters.
- **TenantDetails**: In-depth view of a specific tenant's resource usage, plans, and history.
- **BillingPage**: Global financial tracking of SaaS subscriptions and invoices.
- **PlansPage**: Configuration of SaaS tiers (Starter, Professional, Enterprise) and their limits.
- **SignupMonitor**: Real-time monitoring of new technical assistance registrations and trials.
- **AIInsights**: An intelligent recommendation engine alerting admins about upselling opportunities or trial expirations.

## Key Technologies & Features

- **Global Search**: Search for tenants, customers, or internal pages using `CMD/CTRL + K`.
- **Charts (Recharts)**: High-performance data visualization for MRR growth and revenue forecasting.
- **Activity Feed**: Timeline-based component showing recent platform events (new signups, plan upgrades, suspensions).
- **Insights Engine**: Automated logic that processes platform data to generate actionable business intelligence.
- **Aesthetics**: Dark mode by default, glass-based cards, and interactive hover micro-animations for a premium feel.
