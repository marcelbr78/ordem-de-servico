import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteDocument, QuoteDocStatus, QuoteItem } from './entities/quote-document.entity';
import { OrderService } from '../orders/entities/order-service.entity';
import { QuotePdfService } from './pdf/quote-pdf.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class QuotesService {
    constructor(
        @InjectRepository(QuoteDocument) private quoteRepo: Repository<QuoteDocument>,
        @InjectRepository(OrderService)  private orderRepo: Repository<OrderService>,
        private pdfService: QuotePdfService,
        private settingsService: SettingsService,
    ) {}

    // ── Criar ou atualizar orçamento para uma OS ────────────
    async upsert(orderId: string, dto: {
        items: QuoteItem[];
        discountPercent?: number;
        paymentCondition?: string;
        deliveryDays?: number;
        warrantyDays?: number;
        validDays?: number;
        notes?: string;
    }, tenantId?: string): Promise<QuoteDocument> {
        // Verificar se já existe um rascunho para esta OS
        let quote = await this.quoteRepo.findOne({
            where: { orderId, status: QuoteDocStatus.DRAFT },
        });

        const subtotal = dto.items.reduce((s, i) => s + Number(i.total), 0);
        const discountValue = dto.discountPercent ? (subtotal * Number(dto.discountPercent)) / 100 : 0;
        const total = subtotal - discountValue;

        const validUntil = dto.validDays
            ? new Date(Date.now() + dto.validDays * 86400000).toISOString().slice(0, 10)
            : undefined;

        if (quote) {
            // Atualizar existente — incrementar versão
            Object.assign(quote, {
                itemsJson: JSON.stringify(dto.items),
                subtotal, discountPercent: dto.discountPercent || 0, discountValue, total,
                paymentCondition: dto.paymentCondition, deliveryDays: dto.deliveryDays,
                warrantyDays: dto.warrantyDays, notes: dto.notes,
                ...(validUntil ? { validUntil } : {}),
                version: quote.version + 1,
            });
        } else {
            // Buscar warrantDays padrão das settings
            const defaultWarranty = await this.settingsService.findByKey('os_warranty_days');
            quote = this.quoteRepo.create({
                tenantId, orderId,
                itemsJson: JSON.stringify(dto.items),
                subtotal, discountPercent: dto.discountPercent || 0, discountValue, total,
                paymentCondition: dto.paymentCondition,
                deliveryDays: dto.deliveryDays,
                warrantyDays: dto.warrantyDays || Number(defaultWarranty) || 90,
                validUntil,
                notes: dto.notes,
                status: QuoteDocStatus.DRAFT,
                version: 1,
            });
        }
        return this.quoteRepo.save(quote);
    }

    // ── Buscar orçamento de uma OS ────────────────────────
    async findByOrder(orderId: string): Promise<QuoteDocument[]> {
        return this.quoteRepo.find({ where: { orderId }, order: { version: 'DESC' } });
    }

    async findOne(id: string): Promise<QuoteDocument> {
        const q = await this.quoteRepo.findOne({ where: { id } });
        if (!q) throw new NotFoundException('Orçamento não encontrado');
        return q;
    }

    // ── Mudar status ──────────────────────────────────────
    async send(id: string, userId?: string): Promise<QuoteDocument> {
        const q = await this.findOne(id);
        q.status = QuoteDocStatus.SENT;
        q.sentAt = new Date();
        q.sentByUserId = userId;
        return this.quoteRepo.save(q);
    }

    async approve(id: string, clientName?: string): Promise<QuoteDocument> {
        const q = await this.findOne(id);
        q.status = QuoteDocStatus.APPROVED;
        q.approvedAt = new Date();
        q.approvedByName = clientName || 'Cliente';
        return this.quoteRepo.save(q);
    }

    async reject(id: string, reason?: string): Promise<QuoteDocument> {
        const q = await this.findOne(id);
        q.status = QuoteDocStatus.REJECTED;
        q.rejectedAt = new Date();
        q.rejectionReason = reason;
        return this.quoteRepo.save(q);
    }

    async cancel(id: string): Promise<QuoteDocument> {
        const q = await this.findOne(id);
        q.status = QuoteDocStatus.CANCELED;
        return this.quoteRepo.save(q);
    }

    // ── Gerar PDF ─────────────────────────────────────────
    async generatePdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
        const quote = await this.findOne(id);
        const order = await this.orderRepo.findOne({
            where: { id: quote.orderId },
            relations: ['client', 'equipments'],
        });
        const buffer = await this.pdfService.generateQuotePdf(quote, order);
        const filename = `Orcamento-${order?.protocol || id.slice(0, 8)}-v${quote.version}.pdf`;
        return { buffer, filename };
    }

    // ── Auto-criar itens a partir das peças da OS ─────────
    async autoFillFromOrder(orderId: string): Promise<QuoteItem[]> {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['parts', 'parts.product'],
        });
        if (!order) return [];

        const items: QuoteItem[] = [];

        // Serviço de reparo (valor estimado)
        if (Number(order.estimatedValue) > 0) {
            items.push({
                id: 'svc-1', type: 'service',
                description: `Serviço de reparo — ${order.reportedDefect || 'Diagnóstico e reparo'}`,
                quantity: 1, unitPrice: Number(order.estimatedValue),
                total: Number(order.estimatedValue),
            });
        }

        // Peças utilizadas
        if (order.parts?.length) {
            order.parts.forEach((p: any, i: number) => {
                items.push({
                    id: `part-${i + 1}`, type: 'part',
                    description: p.product?.name || `Peça ${i + 1}`,
                    quantity: p.quantity,
                    unitPrice: Number(p.unitPrice),
                    total: Number(p.quantity) * Number(p.unitPrice),
                });
            });
        }

        return items;
    }

    // ── Verificar validade e marcar expirado ─────────────
    async checkExpiration(): Promise<void> {
        const today = new Date().toISOString().slice(0, 10);
        const expired = await this.quoteRepo.find({ where: { status: QuoteDocStatus.SENT } });
        for (const q of expired) {
            if (q.validUntil && q.validUntil < today) {
                q.status = QuoteDocStatus.EXPIRED;
                await this.quoteRepo.save(q);
            }
        }
    }
}
