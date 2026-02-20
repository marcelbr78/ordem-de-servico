import { Controller, Post, Body, Get, Param, BadRequestException, Logger } from '@nestjs/common';
import { SmartPartsService } from './smartparts.service';
import { SuppliersService } from './suppliers.service';

@Controller('smartparts')
export class SmartPartsController {
    private readonly logger = new Logger(SmartPartsController.name);

    constructor(
        private readonly smartPartsService: SmartPartsService,
        private readonly suppliersService: SuppliersService,
    ) { }

    @Post('webhook/whatsapp')
    async handleWebhook(@Body() body: any) {
        this.logger.log(`Webhook received: ${JSON.stringify(body).substring(0, 200)}`);

        const data = body?.data;
        if (!data) {
            this.logger.warn('Webhook: no data field');
            return { status: 'ignored' };
        }

        // Skip messages sent by us (fromMe)
        if (data.key?.fromMe) {
            this.logger.debug('Webhook: ignoring own message');
            return { status: 'ignored_own' };
        }

        const remoteJid = data.key?.remoteJid;
        const message = data.message?.conversation || data.message?.extendedTextMessage?.text;

        this.logger.log(`Webhook message from ${remoteJid}: "${message?.substring(0, 100)}"`);

        if (remoteJid && message) {
            await this.smartPartsService.handleIncomingMessage(remoteJid, message);
        }

        return { status: 'received' };
    }

    @Post('quotes/start')
    async startQuote(@Body() body: { orderId: string; productName: string }) {
        if (!body.orderId || !body.productName) throw new BadRequestException('Dados incompletos');
        return this.smartPartsService.startQuote(body.orderId, body.productName);
    }

    @Get('quotes/order/:orderId')
    async getQuoteByOrder(@Param('orderId') orderId: string) {
        return this.smartPartsService.getQuoteByOrder(orderId);
    }

    @Get('quotes/:quoteId/responses')
    async getResponses(@Param('quoteId') quoteId: string) {
        return this.smartPartsService.getResponses(quoteId);
    }

    @Post('quotes/:quoteId/approve/:supplierId')
    async approveQuote(
        @Param('quoteId') quoteId: string,
        @Param('supplierId') supplierId: string,
        @Body() details: { price: number, description: string }
    ) {
        this.logger.log(`approveQuote called for ${quoteId} supplier ${supplierId} body: ${JSON.stringify(details)}`);
        try {
            return await this.smartPartsService.approveQuote(quoteId, supplierId, details);
        } catch (error) {
            this.logger.error(`Error approving quote: ${error.message}`, error.stack);
            throw error;
        }
    }

    @Get('quotes/:quoteId/supplier-status')
    async getSupplierStatus(@Param('quoteId') quoteId: string) {
        // Need to get the quote itself to know status/winner
        const quote = await this.smartPartsService.getQuoteById(quoteId);
        const responses = await this.smartPartsService.getResponses(quoteId);
        const allSuppliers = await this.suppliersService.findActive();

        const respondedIds = new Set(responses.map(r => r.supplierId));

        const suppliersData = allSuppliers.map(supplier => {
            const supplierResponses = responses.filter(r => r.supplierId === supplier.id);

            // Aggregation logic:
            // 1. If any response has a price > 0, use the BEST (lowest) price response.
            // 2. Else if any has price == 0, use that (unavailability).
            // 3. Last fallback is the most recent (likely a greeting).

            let bestResponse = supplierResponses[0] || null;

            const withPrice = supplierResponses.filter(r => Number(r.price) > 0);
            if (withPrice.length > 0) {
                bestResponse = withPrice.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
            } else {
                const noStock = supplierResponses.find(r => Number(r.price) === 0);
                if (noStock) {
                    bestResponse = noStock;
                }
            }

            return {
                id: supplier.id,
                name: supplier.name,
                phone: supplier.phone,
                responded: respondedIds.has(supplier.id),
                price: bestResponse?.price ?? null,
                message: bestResponse?.message ?? null,
                receivedAt: bestResponse?.receivedAt ?? null,
            };
        });

        return {
            quoteStatus: quote?.status || 'UNKNOWN',
            winnerId: quote?.winnerId || null,
            suppliers: suppliersData
        };
    }
}
