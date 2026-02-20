import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { QuoteResponse } from './entities/quote-response.entity';
import { Supplier } from './entities/supplier.entity';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { SuppliersService } from './suppliers.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InventoryService } from '../inventory/inventory.service';
import { StockService } from '../inventory/stock.service';

@Injectable()
export class SmartPartsService {
    private readonly logger = new Logger(SmartPartsService.name);

    constructor(
        @InjectRepository(Quote)
        private quoteRepository: Repository<Quote>,
        @InjectRepository(QuoteResponse)
        private responseRepository: Repository<QuoteResponse>,
        private whatsappService: WhatsappService,
        private suppliersService: SuppliersService,
        private inventoryService: InventoryService,
        private stockService: StockService,
    ) { }

    async startQuote(orderId: string, productName: string): Promise<Quote> {
        // Cancel any existing PENDING or EXPIRED quotes for this order so user can retry
        const existingQuotes = await this.quoteRepository.find({
            where: [
                { orderId, status: QuoteStatus.PENDING },
                { orderId, status: QuoteStatus.EXPIRED },
            ],
        });
        for (const eq of existingQuotes) {
            eq.status = QuoteStatus.CANCELLED;
            await this.quoteRepository.save(eq);
            this.logger.log(`Cancelled old quote ${eq.id} (was ${eq.status}) for order ${orderId}`);
        }

        const suppliers = await this.suppliersService.findActive();
        if (suppliers.length === 0) {
            throw new Error('Nenhum fornecedor ativo encontrado.');
        }

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 min timeout

        const quote = this.quoteRepository.create({
            orderId,
            productName,
            status: QuoteStatus.PENDING,
            expiresAt,
        });

        const savedQuote = await this.quoteRepository.save(quote);

        // Send messages with delay
        for (const [index, supplier] of suppliers.entries()) {
            setTimeout(async () => {
                try {
                    // Ensure Brazil country code if missing
                    let phone = supplier.phone.replace(/\D/g, '');
                    if (phone.length <= 11 && !phone.startsWith('55')) {
                        phone = '55' + phone;
                    }

                    const refCode = `#REF${savedQuote.id.substring(0, 4).toUpperCase()}`;
                    this.logger.log(`Sending quote to ${supplier.name} at ${phone} (Ref: ${refCode})`);

                    const msg = `Olá ${supplier.name}, tudo bem? 😊\n\nEstamos precisando de uma peça aqui na loja:\n\n*${productName}*\n\nVocê tem disponível? Qual seria o valor?\n\nObrigado! 🙏\n\n${refCode}`;

                    await this.whatsappService.sendMessage(phone, msg);
                    this.logger.log(`Quote sent to ${supplier.name}`);
                } catch (e) {
                    this.logger.error(`Failed to send quote to ${supplier.name}: ${e.message}`);
                }
            }, index * 4000); // 4s delay between sends
        }

        return savedQuote;
    }

    async handleIncomingMessage(phone: string, message: string): Promise<void> {
        // 1. Clean phone number
        const cleanPhone = phone.replace(/\D/g, '');

        // Find supplier by matching last 8 digits (handles country code variations)
        const allSuppliers = await this.suppliersService.findAll();
        const supplier = allSuppliers.find(s => {
            const supplierDigits = s.phone.replace(/\D/g, '');
            return supplierDigits.endsWith(cleanPhone.slice(-8)) || cleanPhone.endsWith(supplierDigits.slice(-8));
        });

        if (!supplier) {
            this.logger.warn(`Message from unknown number: ${phone}`);
            return;
        }

        // 2. Find active quote
        // Step A: Check for Reference Code in message (e.g. #REF1A2B)
        const refMatch = message.match(/#REF([A-Z0-9]{4})\b/i);
        if (refMatch) {
            const partialId = refMatch[1].toLowerCase();
            const quoteByRef = await this.quoteRepository.createQueryBuilder('quote')
                .where('quote.id LIKE :partialId', { partialId: `${partialId}%` })
                .orderBy('quote.createdAt', 'DESC')
                .getOne();

            if (quoteByRef) {
                this.logger.log(`Matched message from ${supplier.name} to quote ${quoteByRef.id} via Ref Code ${refMatch[0]}`);
                await this.processResponse(quoteByRef, supplier, message);
                return;
            }
        }

        // Step B: Manual matching via Active Quotes (Fallback)
        let activeQuote = await this.quoteRepository.findOne({
            where: {
                status: QuoteStatus.PENDING,
                createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
            },
            order: { createdAt: 'DESC' },
        } as any);

        // Fallback: Check for recently expired quotes if no pending one found
        if (!activeQuote) {
            const recentlyExpired = await this.quoteRepository.findOne({
                where: {
                    createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
                },
                order: { createdAt: 'DESC' },
            } as any);

            if (recentlyExpired) {
                this.logger.warn(`Received response for quote ${recentlyExpired.id} which was not PENDING (status: ${recentlyExpired.status}). Accepting anyway.`);
                activeQuote = recentlyExpired;
            }
        }

        if (!activeQuote) {
            this.logger.warn(`No active quote found for response from ${supplier.name} (${cleanPhone})`);
            return;
        }

        // Step C: If matched manually (no Ref Code), perform a stricter product name check
        // If the user is chatting about something else, don't contaminate the active quote
        const relevance = this.isMessageRelevantToQuote(message, activeQuote.productName);

        if (relevance.type === 'greeting' && !message.match(/\d/)) {
            // It's just a "blz" or "oi", we accept it as "Received"
            this.logger.log(`Acknowledged (greeting) from ${supplier.name} for quote ${activeQuote.id}`);
            await this.registerResponse(activeQuote.id, supplier.id, -1, message);
            return;
        }

        if (relevance.type === 'greeting') {
            // It might be about something else entirely (user manual chat)
            this.logger.warn(`Message from ${supplier.name} seems unrelated to ${activeQuote.productName}. Ignoring to prevent contamination.`);
            return;
        }

        await this.processResponse(activeQuote, supplier, message, relevance);
    }

    /** Helper to process a matched quote response */
    private async processResponse(activeQuote: Quote, supplier: Supplier, message: string, relevance?: any) {
        // 3. Extract prices from message
        const extracted = this.extractPricesFromMessage(message);

        if (extracted.length > 0) {
            const lowestOption = extracted.reduce((a, b) => a.price < b.price ? a : b);
            this.logger.log(
                `Extracted ${extracted.length} option(s) from ${supplier.name} for quote ${activeQuote.id}. ` +
                `Lowest: R$ ${lowestOption.price.toFixed(2)} (${lowestOption.description})`
            );
            await this.registerResponse(activeQuote.id, supplier.id, lowestOption.price, message);
            return;
        }

        // 4. No price found - use relevance check
        const rel = relevance || this.isMessageRelevantToQuote(message, activeQuote.productName);

        if (rel.type === 'unavailability') {
            this.logger.log(`No stock from ${supplier.name} for quote ${activeQuote.id}`);
            await this.registerResponse(activeQuote.id, supplier.id, 0, message);
        } else if (rel.type === 'product_related') {
            this.logger.log(`Relevant (no price) from ${supplier.name} for quote ${activeQuote.id}`);
            await this.registerResponse(activeQuote.id, supplier.id, 0, message);
        } else {
            await this.registerResponse(activeQuote.id, supplier.id, -1, message);
        }
    }

    /**
     * Determines the TYPE of a supplier message relative to the active quote.
     * Returns:
     *  - type: 'unavailability' → supplier said they don't have it
     *  - type: 'product_related' → mentions product, pricing terms, or is long enough to be relevant
     *  - type: 'greeting' → greeting, emoji, or short unrelated message
     */
    private isMessageRelevantToQuote(message: string, productName: string): { type: 'unavailability' | 'product_related' | 'greeting', reason: string } {
        const msgLower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const prodLower = productName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // === Check 1: Unavailability keywords ===
        const unavailableKeywords = [
            'nao tenho', 'não tenho', 'n tenho', 'nao tem', 'não tem',
            'sem estoque', 'esgotou', 'esgotado', 'acabou', 'acabaram',
            'fora de linha', 'descontinuado', 'descontinuada',
            'nao trabalho', 'não trabalho', 'nao mexo', 'não mexo',
            'no momento nao', 'no momento não', 'por enquanto nao',
            'indisponivel', 'indisponível', 'nao disponivel',
            'to sem', 'tô sem', 'estou sem', 'ta em falta', 'está em falta',
            'em falta', 'zerado', 'zerada',
        ];
        for (const kw of unavailableKeywords) {
            if (msgLower.includes(kw)) {
                return { type: 'unavailability', reason: `"${kw}"` };
            }
        }

        // === Check 2: Availability / pricing intent keywords ===
        const pricingKeywords = [
            'tenho', 'tem sim', 'temos', 'consigo',
            'valor', 'preco', 'preço', 'custa', 'cobro', 'faco', 'faço',
            'fica', 'sai por', 'sai a', 'por r$', 'r$',
            'reais', 'real', 'conto', 'pila',
            'original', 'oled', 'china', 'nacional', 'premium',
            'compativel', 'compatível', 'genuina', 'genuína',
            'mando', 'envio', 'entrego', 'posso mandar',
            'qualidade', 'garantia',
        ];
        for (const kw of pricingKeywords) {
            if (msgLower.includes(kw)) {
                return { type: 'product_related', reason: `pricing/availability: "${kw}"` };
            }
        }

        // === Check 3: Product name match (fuzzy) ===
        const productWords = prodLower.split(/\s+/).filter(w => w.length >= 3 && !['tela', 'iphone', 'samsung', 'para', 'com'].includes(w));
        const matchedWords = productWords.filter(word => msgLower.includes(word));

        // Stricter match: if we have significant words (like "M23" or "11"), they MUST match
        if (matchedWords.length >= 1) {
            return { type: 'product_related', reason: `product mention: [${matchedWords.join(', ')}]` };
        }

        // If message contains other product-like words (model names) that ARE NOT in our product, it's likely unrelated
        const modelPattern = /\b([a-z]\d{2,3}|iphone\s*\d+|moto\s*[a-z]\d+|g\d{1,2})\b/gi;
        const msgModels = [...msgLower.matchAll(modelPattern)].map(m => m[1]);
        const prodModels = [...prodLower.matchAll(modelPattern)].map(m => m[1]);

        if (msgModels.length > 0) {
            const hasUnexpectedModel = msgModels.some(m => !prodModels.includes(m));
            if (hasUnexpectedModel) {
                return { type: 'greeting', reason: 'mentions different model' };
            }
        }

        // === Check 4: Long messages (40+ chars) might be relevant if no conflicting model found ===
        if (message.trim().length >= 40) {
            return { type: 'product_related', reason: 'long message, possibly relevant' };
        }

        // === Default: It's a greeting or unrelated short message ===
        return { type: 'greeting', reason: 'greeting or unrelated' };
    }

    /**
     * Extracts product/price pairs from supplier messages.
     */
    private extractPricesFromMessage(message: string): Array<{ description: string, price: number }> {
        const results: Array<{ description: string, price: number }> = [];

        // === Pattern A: Catalog (Code - Description - Price) ===
        // We use \b boundary and \d+ to ensure we capture the FULL number, not just parts
        // Also support multiple spaces (\s+) as column separators
        const catalogPattern = /(?:^|\n)(?:(?:📱|🔧|⚙️|📦)?\s*[\w\d\-\.]+\b\s+)?(.+?)(?:\s+[-–:]\s+|\s{2,})[^\d\n]*(?:\d+[-–]\d+\s+)?(?:💰|💵|💲|R\$|r\$)?\s*(\d+(?:[.,]\d+)*)\b/gim;

        let catalogMatch;
        while ((catalogMatch = catalogPattern.exec(message)) !== null) {
            const description = catalogMatch[1].trim().replace(/[-–]\s*$/, '').trim();
            const priceStr = catalogMatch[2];

            // Filter out obviously too long strings that aren't prices
            if (priceStr.replace(/\D/g, '').length > 6) continue;

            const price = this.parsePrice(priceStr);
            if (price !== null && price > 0) {
                results.push({ description: description || 'Sem descrição', price });
            }
        }

        // === Pattern B: Line ending with price (Common List Format) ===
        if (results.length === 0) {
            // Priority for lines ending with a number, often with "R$" or just after spaces
            const linePricePattern = /^(.+?)\s+(?:R\$|r\$)?\s*(\b\d+(?:[.,]\d+)*\b)\s*$/gim;
            let lineMatch;
            while ((lineMatch = linePricePattern.exec(message)) !== null) {
                const desc = lineMatch[1].trim();
                const price = this.parsePrice(lineMatch[2]);
                if (price && price > 0) {
                    results.push({ description: desc, price });
                }
            }
        }

        if (results.length > 0) return results;

        // === Pattern C: Multiple "R$" values in a single message ===
        const allRMatches = [...message.matchAll(/(?:R\$|r\$)\s*(\b\d+(?:[.,]\d+)*\b)/gi)];
        if (allRMatches.length > 0) {
            for (const m of allRMatches) {
                const price = this.parsePrice(m[1]);
                if (price !== null && price > 0) {
                    const idx = m.index || 0;
                    const context = message.substring(Math.max(0, idx - 40), idx).trim();
                    const desc = context.split('\n').pop()?.trim() || 'Opção';
                    results.push({ description: desc, price });
                }
            }
            if (results.length > 0) return results;
        }

        // === Pattern D: Single price in natural language ===
        const price = this.extractSinglePrice(message);
        if (price !== null && price > 0) {
            results.push({ description: 'Resposta direta', price });
        }

        return results;
    }

    /** Extract a single price from a simple natural language message */
    private extractSinglePrice(message: string): number | null {
        const normalized = message.toLowerCase().trim();

        // "150 reais" / "200 real" / "89,90 conto"
        const reaisMatch = normalized.match(/\b(\d+(?:[.,]\d+)*)\b\s*(?:reais|real|conto|pila)/);
        if (reaisMatch) return this.parsePrice(reaisMatch[1]);

        // "por 150" / "consigo 200" / "tenho a 89,90"
        const keywordMatch = normalized.match(/(?:por|valor|pre[çc]o|consigo|tenho|fa[çc]o|fazer|fica|sai|cobro|custa)\s*(?:[\w\s]{0,10})?(?:de\s*)?(?:a\s*)?(?:r\$\s*)?\b(\d+(?:[.,]\d+)*)\b/);
        if (keywordMatch) return this.parsePrice(keywordMatch[1]);

        // Plain number only (entire message is just a number)
        const plainMatch = normalized.match(/^\s*(?:r\$\s*)?\b(\d+(?:[.,]\d+)*)\b\s*$/);
        if (plainMatch) return this.parsePrice(plainMatch[1]);

        return null;
    }

    /** Convert Brazilian price format to number: 1.200,50 -> 1200.50 / 75.00 -> 75 */
    private parsePrice(priceStr: string): number | null {
        let cleaned = priceStr.trim();

        if (cleaned.includes(',')) {
            // Brazilian format: dots are thousands, comma is decimal
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else if (cleaned.includes('.') && !cleaned.match(/^\d+\.\d{1,2}$/)) {
            // Cases like 1.200 (no decimals, just thousands)
            cleaned = cleaned.replace(/\./g, '');
        }

        const value = parseFloat(cleaned);
        return isNaN(value) ? null : value;
    }

    async registerResponse(quoteId: string, supplierId: string, price: number, message: string) {
        const response = this.responseRepository.create({
            quoteId,
            supplierId,
            price,
            message,
        });
        await this.responseRepository.save(response);

        // Update Best Price — only for REAL prices (> 0), ignore acknowledged (-1) and no-stock (0)
        if (price > 0) {
            const quote = await this.quoteRepository.findOne({ where: { id: quoteId }, relations: ['winner'] });
            if (quote && (!quote.bestPrice || price < quote.bestPrice)) {
                quote.bestPrice = price;
                quote.winnerId = supplierId;
                await this.quoteRepository.save(quote);
            }
        }
    }

    async getQuoteById(id: string): Promise<Quote> {
        return this.quoteRepository.findOne({ where: { id } });
    }

    async getQuoteByOrder(orderId: string) {
        return this.quoteRepository.findOne({
            where: { orderId },
            order: { createdAt: 'DESC' },
            relations: ['winner'],
        });
    }

    async getResponses(quoteId: string): Promise<QuoteResponse[]> {
        return this.responseRepository.find({
            where: { quoteId },
            order: { receivedAt: 'DESC' },
        });
    }

    async approveQuote(quoteId: string, supplierId: string, details?: { price: number, description: string }): Promise<Quote> {
        const quote = await this.quoteRepository.findOne({ where: { id: quoteId } });
        if (!quote) throw new Error('Cotação não encontrada');

        const supplier = await this.suppliersService.findOne(supplierId);
        if (!supplier) throw new Error('Fornecedor não encontrado');

        const response = await this.responseRepository.findOne({
            where: { quoteId, supplierId },
            order: { receivedAt: 'DESC' }
        });

        const finalPrice = Number(details?.price ?? (response ? response.price : 0)) || 0;
        const finalDesc = (details?.description || quote.productName || '').toString().trim();

        // Update quote
        quote.status = QuoteStatus.COMPLETED;
        quote.winnerId = supplierId;
        quote.bestPrice = finalPrice;
        if (details?.description) {
            quote.productName = details.description;
        }

        const updated = await this.quoteRepository.save(quote);
        this.logger.log(`Quote ${quoteId} approved for supplier ${supplierId}`);

        // Create Product & Add Stock Entry
        if (finalPrice > 0) {
            try {
                const product = await this.inventoryService.findOrCreateProduct(finalDesc, finalPrice);

                await this.stockService.addStock(quote.orderId, [{
                    productId: product.id,
                    quantity: 1,
                    cost: finalPrice
                }]);

                this.logger.log(`Stock entry created for ${product.name} (linked to Order ${quote.orderId})`);
            } catch (e) {
                this.logger.error(`Failed to create stock entry: ${e.message}`);
            }
        }

        // Send confirmation message
        let phone = supplier.phone.replace(/\D/g, '');
        if (phone.length <= 11 && !phone.startsWith('55')) phone = '55' + phone;

        const priceText = finalPrice > 0 ? ` (R$ ${finalPrice.toFixed(2).replace('.', ',')})` : '';
        const msg = `✅ *PEDIDO APROVADO!*\n\nOlá ${supplier.name}, pode confirmar o pedido da peça:\n\n*${finalDesc}*${priceText}\n\nQual o prazo de entrega? 📦\n\nMuito obrigado! 🙏`;

        try {
            await this.whatsappService.sendMessage(phone, msg);
            this.logger.log(`Approval message sent to ${supplier.name}`);
        } catch (e) {
            this.logger.error(`Failed to send approval msg to ${supplier.name}: ${e.message}`);
        }

        return updated;
    }

    // Cron to expire quotes
    @Cron(CronExpression.EVERY_MINUTE)
    async checkExpiredQuotes() {
        const expired = await this.quoteRepository.createQueryBuilder('quote')
            .where('quote.status = :status', { status: QuoteStatus.PENDING })
            .andWhere('quote.expiresAt < :now', { now: new Date() })
            .getMany();

        for (const quote of expired) {
            quote.status = QuoteStatus.EXPIRED;
            await this.quoteRepository.save(quote);
            this.logger.log(`Cotação ${quote.id} expirada.`);
        }
    }
}
