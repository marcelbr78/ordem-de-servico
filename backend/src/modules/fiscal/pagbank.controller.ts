import { Controller, Get, Post, Body, Headers, HttpCode, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SettingsService } from '../settings/settings.service';
import { FiscalService } from '../fiscal/fiscal.service';
import axios from 'axios';

@Controller('pagbank')
export class PagBankController {
    constructor(
        private readonly settings: SettingsService,
        private readonly fiscal: FiscalService,
    ) { }

    // ══════════════════════════════════════════════════
    // Status / testar token PagBank
    // ══════════════════════════════════════════════════
    @Get('status')
    @UseGuards(JwtAuthGuard)
    async status() {
        const token = await this.settings.findByKey('pagbank_token') || process.env.PAGBANK_TOKEN;
        const ambiente = await this.settings.findByKey('pagbank_ambiente') || 'sandbox';

        if (!token) throw new HttpException('Token PagBank não configurado', HttpStatus.BAD_REQUEST);

        const baseUrl = ambiente === 'production'
            ? 'https://api.pagseguro.com'
            : 'https://sandbox.api.pagseguro.com';

        try {
            const { data } = await axios.get(`${baseUrl}/accounts`, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                timeout: 10000,
            });

            return {
                connected: true,
                nome: data?.owner?.name || data?.name || 'Conta PagBank',
                email: data?.owner?.email || data?.email || '',
                ambiente,
            };
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
                return { connected: false, message: 'Token inválido ou sem permissão' };
            }
            return { connected: false, message: err?.response?.data?.error_messages?.[0]?.description || err.message };
        }
    }

    // ══════════════════════════════════════════════════
    // Webhook PagBank → Lança financeiro + emite NF
    // ══════════════════════════════════════════════════
    @Post('webhook')
    @HttpCode(200)
    async webhook(
        @Body() body: any,
        @Headers('x-pagbank-signature') signature: string,
    ) {
        // Verificar tipo do evento
        const tipo = body?.type || body?.event;
        if (!tipo) return { received: true };

        const eventosAceitos = ['CHARGE.PAID', 'PAYMENT_ORDER.PAID', 'order.paid', 'payment.confirmed', 'pix.received'];
        if (!eventosAceitos.some(e => tipo.toLowerCase().includes(e.split('.')[0].toLowerCase()))) {
            return { received: true, ignored: true };
        }

        // Extrair dados do pagamento
        const charges = body?.charges || body?.order?.charges || [];
        const charge = charges[0] || body;
        const valor = (charge?.amount?.value || body?.amount || 0) / (charge?.amount?.value > 100 ? 100 : 1);
        const orderId = body?.reference_id || body?.metadata?.orderId || body?.external_reference || null;
        const clienteId = body?.metadata?.clienteId || null;
        const referenceId = body?.id || body?.event_id || `pagbank_${Date.now()}`;

        const autoNf = await this.settings.findByKey('pagbank_auto_nf') || 'nenhuma';

        // Processar via FiscalService (lança financeiro + emite NF se configurado)
        try {
            await this.fiscal.processarWebhookPagamento({
                eventId: referenceId,
                event: tipo,
                amount: valor,
                orderId,
                clienteId,
                metadata: { autoNf, raw: body },
            });
        } catch (err) {
            console.error('[PagBank Webhook Error]', err);
        }

        return { received: true, orderId, valor };
    }
}
