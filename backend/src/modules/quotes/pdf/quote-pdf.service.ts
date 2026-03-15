import { Injectable } from '@nestjs/common';
import { QuoteDocument, QuoteItem } from '../entities/quote-document.entity';
import { SettingsService } from '../../settings/settings.service';
import * as PDFDocument from 'pdfkit';

const R$ = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtDate = (d: string | Date) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

@Injectable()
export class QuotePdfService {
    constructor(private settingsService: SettingsService) {}

    async generateQuotePdf(quote: QuoteDocument, order: any): Promise<Buffer> {
        const keys = ['company_name','company_fantasy_name','company_cnpj','company_phone','company_email',
            'company_address_street','company_address_number','company_address_city','company_address_state',
            'company_address_zip','company_logo_url','terms_general','terms_warranty','os_primary_color',
            'company_website'];
        const cfg: Record<string, string> = {};
        await Promise.all(keys.map(async k => { cfg[k] = (await this.settingsService.findByKey(k)) || ''; }));

        const accent = cfg.os_primary_color || '#3b82f6';
        const companyName = cfg.company_fantasy_name || cfg.company_name || 'Assistência Técnica';
        const items: QuoteItem[] = JSON.parse(quote.itemsJson || '[]');

        return new Promise((resolve, reject) => {
            const buffers: Buffer[] = [];
            const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 45, right: 45 }, info: { Title: `Orçamento #${order?.protocol || quote.id.slice(0, 8)}` } });
            doc.on('data', (c: Buffer) => buffers.push(c));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const W = doc.page.width - 90;
            const L = 45;
            let y = 0;

            // ── FAIXA COLORIDA TOPO ──────────────────────────
            doc.rect(0, 0, doc.page.width, 5).fill(accent);

            // ── LOGO / NOME EMPRESA ──────────────────────────
            y = 22;
            doc.fontSize(18).font('Helvetica-Bold').fillColor('#111827').text(companyName, L, y);
            y += 22;
            doc.fontSize(8).font('Helvetica').fillColor('#6b7280');
            if (cfg.company_cnpj) { doc.text(`CNPJ: ${cfg.company_cnpj}`, L, y); y += 12; }
            const addr = [cfg.company_address_street, cfg.company_address_number, cfg.company_address_city, cfg.company_address_state].filter(Boolean).join(', ');
            if (addr) { doc.text(addr, L, y); y += 12; }
            if (cfg.company_phone) { doc.text(`Tel: ${cfg.company_phone}`, L, y); y += 12; }
            if (cfg.company_email) { doc.text(`E-mail: ${cfg.company_email}`, L, y); }

            // ── BOX ORÇAMENTO (direita) ──────────────────────
            const bx = L + W * 0.6, bw = W * 0.4;
            doc.roundedRect(bx, 18, bw, 76, 6).fill('#f8fafc');
            doc.fontSize(9).font('Helvetica').fillColor('#6b7280').text('ORÇAMENTO', bx + 10, 26);
            doc.fontSize(17).font('Helvetica-Bold').fillColor(accent).text(`#${order?.protocol || '—'}`, bx + 10, 38);
            doc.fontSize(8).font('Helvetica').fillColor('#9ca3af');
            doc.text(`Versão: ${quote.version}`, bx + 10, 60);
            doc.text(`Emissão: ${fmtDate(quote.createdAt)}`, bx + 10, 71);
            if (quote.validUntil) doc.text(`Validade: ${fmtDate(quote.validUntil)}`, bx + 10, 82);

            y = 112;
            // ── SEPARADOR ────────────────────────────────────
            doc.rect(L, y, W, 1).fill('#e5e7eb'); y += 14;

            // ── STATUS BADGE ─────────────────────────────────
            const statusLabel: Record<string, { label: string; color: string }> = {
                draft:    { label: 'RASCUNHO',  color: '#94a3b8' },
                sent:     { label: 'ENVIADO',   color: '#3b82f6' },
                approved: { label: 'APROVADO',  color: '#22c55e' },
                rejected: { label: 'REJEITADO', color: '#ef4444' },
                expired:  { label: 'EXPIRADO',  color: '#f97316' },
                canceled: { label: 'CANCELADO', color: '#6b7280' },
            };
            const stCfg = statusLabel[quote.status] || statusLabel.draft;
            doc.roundedRect(L, y, 90, 18, 4).fill(stCfg.color + '22');
            doc.fontSize(9).font('Helvetica-Bold').fillColor(stCfg.color).text(stCfg.label, L + 8, y + 5);
            y += 28;

            // ── CLIENTE ──────────────────────────────────────
            const sectionHeader = (title: string, yPos: number) => {
                doc.rect(L, yPos, W, 22).fill('#f1f5f9');
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151').text(title, L + 8, yPos + 7);
                return yPos + 28;
            };

            y = sectionHeader('DADOS DO CLIENTE', y);
            const client = order?.client;
            const col1x = L, col2x = L + W / 2;
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280').text('NOME / RAZÃO SOCIAL', col1x, y);
            doc.fontSize(10).font('Helvetica').fillColor('#111827').text(client?.nome || '—', col1x, y + 11);
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280').text('CPF / CNPJ', col2x, y);
            doc.fontSize(10).font('Helvetica').fillColor('#111827').text(client?.cpf || client?.cnpj || '—', col2x, y + 11);
            y += 32;
            if (client?.contatos?.[0]) {
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280').text('TELEFONE / WHATSAPP', col1x, y);
                doc.fontSize(10).font('Helvetica').fillColor('#111827').text(client.contatos[0].numero || '—', col1x, y + 11);
                y += 24;
            }
            y += 8;

            // ── EQUIPAMENTO ──────────────────────────────────
            y = sectionHeader('EQUIPAMENTO', y);
            const equip = order?.equipments?.[0];
            if (equip) {
                const fields2: Array<[string, string]> = [
                    ['TIPO', equip.type || '—'], ['MARCA', equip.brand || equip.marca || '—'],
                    ['MODELO', equip.model || equip.modelo || '—'], ['SERIAL/IMEI', equip.serial || '—'],
                ];
                const colW = W / fields2.length;
                fields2.forEach(([label, value], i) => {
                    const cx = col1x + i * colW;
                    doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280').text(label, cx, y);
                    doc.fontSize(9).font('Helvetica').fillColor('#111827').text(value, cx, y + 11, { width: colW - 4 });
                });
                y += 32;
            }
            if (order?.reportedDefect) {
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280').text('DEFEITO RELATADO', L, y);
                doc.fontSize(9).font('Helvetica').fillColor('#111827').text(order.reportedDefect, L, y + 11, { width: W });
                y += 28;
            }
            y += 8;

            // ── ITENS DO ORÇAMENTO ────────────────────────────
            y = sectionHeader('ITENS DO ORÇAMENTO', y);

            // Cabeçalho da tabela
            const colDesc = 0.5, colQtd = 0.1, colUnit = 0.18, colTotal = 0.18, colObs = 0.04;
            const th = (text: string, x: number, w: number) => {
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280').text(text, x, y, { width: w * W });
            };
            th('DESCRIÇÃO', L, colDesc);
            th('QTD', L + colDesc * W, colQtd);
            th('UNIT.', L + (colDesc + colQtd) * W, colUnit);
            th('TOTAL', L + (colDesc + colQtd + colUnit) * W, colTotal);
            y += 14;
            doc.rect(L, y - 2, W, 1).fill('#e5e7eb');

            let subtotal = 0;
            items.forEach((item, i) => {
                const rowH = 20;
                if (i % 2 === 0) doc.rect(L, y, W, rowH).fill('#fafafa');
                doc.fontSize(9).font('Helvetica').fillColor('#111827').text(item.description, L + 2, y + 6, { width: colDesc * W - 4 });
                doc.text(String(item.quantity), L + colDesc * W + 2, y + 6, { width: colQtd * W - 4 });
                doc.text(R$(item.unitPrice), L + (colDesc + colQtd) * W + 2, y + 6, { width: colUnit * W - 4 });
                doc.text(R$(item.total), L + (colDesc + colQtd + colUnit) * W + 2, y + 6, { width: colTotal * W - 4 });
                subtotal += item.total;
                y += rowH;
            });

            if (items.length === 0) {
                doc.fontSize(9).font('Helvetica').fillColor('#9ca3af').text('Nenhum item cadastrado', L, y + 6);
                y += 20;
            }

            doc.rect(L, y, W, 1).fill('#e5e7eb'); y += 12;

            // ── TOTAIS ───────────────────────────────────────
            const txRight = L + W - 140, txW = 100, valX = L + W - 36;
            const totalRow = (label: string, value: string, bold = false, color = '#111827') => {
                doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#6b7280').text(label, txRight, y, { width: 100 });
                doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(color).text(value, txRight + 100, y, { width: 80, align: 'right' });
                y += 14;
            };

            totalRow('Subtotal:', R$(quote.subtotal || subtotal));
            if (Number(quote.discountPercent) > 0) totalRow(`Desconto (${quote.discountPercent}%):`, `-${R$(quote.discountValue)}`, false, '#ef4444');
            y += 2;
            doc.rect(txRight, y, 180, 1).fill(accent); y += 4;
            totalRow('TOTAL:', R$(quote.total || (subtotal - Number(quote.discountValue))), true, accent);
            y += 6;

            // ── CONDIÇÕES ────────────────────────────────────
            if (quote.paymentCondition || quote.deliveryDays || quote.warrantyDays) {
                y = sectionHeader('CONDIÇÕES', y + 6);
                const conds: Array<[string, string]> = [];
                if (quote.paymentCondition) conds.push(['Pagamento', quote.paymentCondition]);
                if (quote.deliveryDays) conds.push(['Prazo de entrega', `${quote.deliveryDays} dias úteis`]);
                if (quote.warrantyDays) conds.push(['Garantia', `${quote.warrantyDays} dias`]);
                if (quote.validUntil) conds.push(['Validade do orçamento', fmtDate(quote.validUntil)]);
                const cW = W / Math.min(conds.length, 4);
                conds.slice(0, 4).forEach(([label, value], i) => {
                    const cx = L + i * cW;
                    doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280').text(label.toUpperCase(), cx, y);
                    doc.fontSize(9).font('Helvetica').fillColor('#111827').text(value, cx, y + 11, { width: cW - 4 });
                });
                y += 32;
            }

            // ── OBSERVAÇÕES ──────────────────────────────────
            if (quote.notes) {
                y += 4;
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280').text('OBSERVAÇÕES', L, y); y += 12;
                doc.fontSize(9).font('Helvetica').fillColor('#374151').text(quote.notes, L, y, { width: W }); y += 20;
            }

            // ── TERMOS ───────────────────────────────────────
            if (cfg.terms_general || cfg.terms_warranty) {
                const termsText = [cfg.terms_general, cfg.terms_warranty].filter(Boolean).join('\n\n');
                y += 6;
                doc.rect(L, y, W, 1).fill('#e5e7eb'); y += 10;
                doc.fontSize(7).font('Helvetica-Bold').fillColor('#9ca3af').text('TERMOS E CONDIÇÕES', L, y); y += 10;
                doc.fontSize(7).font('Helvetica').fillColor('#9ca3af').text(termsText.slice(0, 600), L, y, { width: W });
                y += 40;
            }

            // ── APROVAÇÃO (se aprovado) ───────────────────────
            if (quote.status === 'approved' && quote.approvedAt) {
                y += 8;
                doc.rect(L, y, W, 42).fill('#f0fdf4');
                doc.rect(L, y, W, 42).stroke('#22c55e');
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#16a34a').text('✓  ORÇAMENTO APROVADO', L + 12, y + 8);
                doc.fontSize(8).font('Helvetica').fillColor('#166534').text(`Aprovado por: ${quote.approvedByName || '—'}  em  ${fmtDate(quote.approvedAt)}`, L + 12, y + 24);
                y += 52;
            }

            // ── ASSINATURA ───────────────────────────────────
            if (quote.status !== 'approved') {
                y += 24;
                if (y > doc.page.height - 120) { doc.addPage(); y = 40; }
                const sigX = L + W - 220;
                doc.rect(sigX, y, 220, 1).fill('#374151');
                doc.fontSize(8).font('Helvetica').fillColor('#6b7280').text('Assinatura e carimbo do cliente', sigX, y + 4, { width: 220, align: 'center' });
                doc.fontSize(7).font('Helvetica').fillColor('#9ca3af').text('Ao assinar, o cliente declara estar ciente e concordar com as condições acima.', L, y + 14, { width: W, align: 'center' });
            }

            // ── RODAPÉ ───────────────────────────────────────
            const footY = doc.page.height - 30;
            doc.rect(0, footY, doc.page.width, 1).fill('#e5e7eb');
            doc.fontSize(7).font('Helvetica').fillColor('#9ca3af')
                .text(`${companyName}${cfg.company_phone ? ' · Tel: ' + cfg.company_phone : ''}${cfg.company_email ? ' · ' + cfg.company_email : ''}`, L, footY + 8, { width: W, align: 'center' });

            doc.end();
        });
    }
}
