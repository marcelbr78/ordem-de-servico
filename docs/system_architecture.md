# System Architecture

## Overview

The internal Ordem de Serviço application has evolved into a full-fledged Software as a Service (SaaS) platform, supporting multi-tenant isolation, intelligent repair suggestions, and global administration.

## Backend Modules

- **Auth & Users**: Handles JWT authentication and role-based access.
- **Tenants**: Manages isolated multi-tenant data, SaaS subscriptions, and plans.
- **Orders**: Core work order management, equipment tracking, and history logs.
- **Finance**: Manages transactions, bank accounts, and MRR.
- **Inventory & SmartParts (Quotes)**: Tracks physical stock and manages autonomous WhatsApp-based part quoting.
- **Fiscal**: Automates NF-e and NFS-e generation.
- **Admin**: Dedicated and isolated super-admin namespace for managing the SaaS platform.

## Event System

The system is deeply decoupled using `EventEmitter2`. Core actions, like `work_order.completed` or `work_order.status_changed`, fire asynchronous events across the application. This allows independent modules (like Audit logs or Machine Learning trackers) to react to state changes without polluting the core transaction workflow.

## Smart Modules

A suite of intelligent modules operates passively by listening to completed Work Orders to build predictive models:

- **Smart Diagnostics**: Learns from `(model, symptom)` pairs to suggest the statistically most probable diagnosis.
- **Smart Pricing**: Aggregates the `AVG()`, `MIN()`, and `MAX()` repair costs and duration for specific repair types.
- **Smart Parts**: Natively joins the Order and Quote histories to recommend the most frequently used parts for a specific diagnosis without creating redundant tracking tables.

## Admin SaaS Architecture

The Super Admin environment is completely walled off from the tenant data flows.

- Routes prefixed with `/admin` bypass standard tenant filters.
- Restricted exclusively to users with the `super_admin` role.
- Interacts globally with all SaaS entities (Plans, Subscriptions, Tenants) allowing platform owners to monitor MRR and manage store access without tenant context bleed.
