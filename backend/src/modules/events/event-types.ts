// ─── Event Names ────────────────────────────────
export enum AppEvent {
    WORK_ORDER_CREATED = 'work_order.created',
    WORK_ORDER_STATUS_CHANGED = 'work_order.status_changed',
    QUOTE_UPDATED = 'quote.updated',
}

// ─── Event Payloads ─────────────────────────────
export interface WorkOrderCreatedPayload {
    orderId: string;
    protocol: string;
    clientId: string;
    technicianId: string;
    tenantId?: string;
    userId?: string;
    timestamp: Date;
}

export interface WorkOrderStatusChangedPayload {
    orderId: string;
    protocol: string;
    previousStatus: string;
    newStatus: string;
    comments?: string;
    tenantId?: string;
    userId?: string;
    timestamp: Date;
}

export interface QuoteUpdatedPayload {
    quoteId: string;
    orderId: string;
    status: string;
    tenantId?: string;
    timestamp: Date;
}

export type AppEventPayload = {
    [AppEvent.WORK_ORDER_CREATED]: WorkOrderCreatedPayload;
    [AppEvent.WORK_ORDER_STATUS_CHANGED]: WorkOrderStatusChangedPayload;
    [AppEvent.QUOTE_UPDATED]: QuoteUpdatedPayload;
};
