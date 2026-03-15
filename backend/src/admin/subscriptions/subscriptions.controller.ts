import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@Controller('admin/subscriptions')
export class SubscriptionsController {
    private readonly logger = new Logger(SubscriptionsController.name);

    constructor(private readonly svc: SubscriptionsService) {}

    @Get()
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    findAll() {
        return this.svc.findAll();
    }

    @Get(':tenantId')
    @UseGuards(JwtAuthGuard, SuperAdminGuard)
    findByTenant(@Param('tenantId') tenantId: string) {
        return this.svc.findByTenant(tenantId);
    }
}

// ── Webhook público (sem auth — autenticado via secret no header) ─────────
import { Headers } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('billing/webhook')
export class BillingWebhookController {
    private readonly logger = new Logger(BillingWebhookController.name);

    constructor(
        private readonly svc: SubscriptionsService,
        private readonly config: ConfigService,
    ) {}

    @Post('pagbank')
    @HttpCode(HttpStatus.OK)
    async pagbankWebhook(
        @Body() body: any,
        @Headers('x-pagbank-signature') signature: string,
    ) {
        this.logger.log(`[PagBank] Webhook recebido: ${body?.type || body?.event}`);

        // Validar assinatura (opcional mas recomendado)
        const secret = this.config.get('PAGBANK_WEBHOOK_SECRET');
        if (secret && signature !== secret) {
            this.logger.warn('[PagBank] Assinatura inválida');
            return { received: false, error: 'Invalid signature' };
        }

        // Normalizar payload do PagBank para nosso formato
        const event = this.normalizePagBankEvent(body);
        if (!event) return { received: true, action: 'ignored' };

        const result = await this.svc.processWebhook(event);
        return { received: true, ...result };
    }

    @Post('generic')
    @HttpCode(HttpStatus.OK)
    async genericWebhook(@Body() body: any) {
        this.logger.log(`[Billing] Webhook genérico: ${body?.event}`);
        const result = await this.svc.processWebhook({
            event: body.event,
            externalId: body.subscriptionId || body.externalId,
            tenantId: body.tenantId || body.metadata?.tenantId,
            amount: body.amount,
            nextBillingDate: body.nextBillingDate,
            metadata: body.metadata,
        });
        return { received: true, ...result };
    }

    private normalizePagBankEvent(body: any): any {
        if (!body) return null;

        // PagBank v4 event format
        const type = body.type || body.event || '';
        const charge = body.charges?.[0] || body.charge || {};
        const metadata = charge.metadata || body.metadata || {};

        let event: string;
        if (type.includes('PAID') || type.includes('AUTHORIZED') || type === 'charge.paid') {
            event = 'payment.confirmed';
        } else if (type.includes('DECLINED') || type.includes('FAILED') || type === 'charge.failed') {
            event = 'payment.failed';
        } else if (type.includes('OVERDUE') || type === 'charge.overdue') {
            event = 'charge.overdue';
        } else if (type.includes('CANCEL')) {
            event = 'subscription.cancelled';
        } else {
            return null;
        }

        return {
            event,
            externalId: charge.id || body.id,
            tenantId: metadata.tenantId,
            amount: charge.amount?.value ? charge.amount.value / 100 : undefined,
            nextBillingDate: body.next_invoice_at,
            metadata,
        };
    }
}
