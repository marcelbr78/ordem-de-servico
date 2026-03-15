import { Injectable } from '@nestjs/common';
import { OrderService as OS } from '../entities/order-service.entity';
import { SettingsService } from '../../settings/settings.service';
import * as PDFDocument from 'pdfkit';

const STATUS_LABEL: Record<string, string> = {
    aberta: 'Aberta',
    em_diagnostico: 'Em Diagnóstico',
    aguardando_aprovacao: 'Aguardando Aprovação',
    aguardando_peca: 'Aguardando Peça',
    em_reparo: 'Em Reparo',
    testes: 'Em Testes',
    finalizada: 'Finalizada',
    entregue: 'Entregue',
    cancelada: 'Cancelada',
};

const PRIORITY_LABEL: Record<string, string> = {
    baixa: 'Baixa', normal: 'Normal', alta: 'Alta', urgente: 'URGENTE',
};

const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

const fmtDate = (d: Date | string) =>
    d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

@Injectable()
export class OrderPdfService {
    constructor(private settingsService: SettingsService) {}

    async generateOrderPdf(order: OS): Promise<Buffer> {
        // Buscar configs da empresa
        const [companyName, companyPhone, companyUrl, serviceTerms, primaryColor] = await Promise.all([
            this.settingsService.findByKey('company_name'),
            this.settingsService.findByKey('company_phone'),
            this.settingsService.findByKey('company_url'),
            this.settingsService.findByKey('service_terms'),
            this.settingsService.findByKey('os_primary_color'),
        ]);

        const accentColor = primaryColor || '#1d4ed8';
        const name = companyName || 'Assistência Técnica';
        const phone = companyPhone || '';
        const url = companyUrl || '';

        return new Promise((resolve, reject) => {
            const buffers: Buffer[] = [];
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                info: { Title: `OS #${order.protocol}`, Author: name },
            });

            doc.on('data', (chunk: Buffer) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const W = doc.page.width - 80; // usable width
            const L = 40; // left margin

            // ── HEADER ─────────────────────────────────────────
            // Faixa de cor no topo
            doc.rect(0, 0, doc.page.width, 6).fill(accentColor);

            // Nome da empresa
            doc.fontSize(20).font('Helvetica-Bold').fillColor('#111827').text(name, L, 24, { width: W * 0.6 });

            // Contatos da empresa
            let infoY = 28;
            doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
            if (phone) { doc.text(`Tel: ${phone}`, L, infoY + 18); infoY += 12; }
            if (url) { doc.text(url, L, infoY + 18); }

            // Box do protocolo (canto direito)
            const boxX = L + W * 0.62;
            doc.roundedRect(boxX, 16, W * 0.38, 58, 6).fill('#f3f4f6');
            doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text('ORDEM DE SERVIÇO', boxX + 10, 24);
            doc.fontSize(18).font('Helvetica-Bold').fillColor(accentColor).text(`#${order.protocol}`, boxX + 10, 38);
            doc.fontSize(8).font('Helvetica').fillColor('#9ca3af').text(`Abertura: ${fmtDate(order.entryDate)}`, boxX + 10, 62);

            doc.moveDown(0.5);
            const afterHeader = 90;

            // ── STATUS BAR ──────────────────────────────────────
            doc.rect(L, afterHeader, W, 28).fill(accentColor);
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#ffffff')
                .text(`Status: ${STATUS_LABEL[order.status] || order.status}   |   Prioridade: ${PRIORITY_LABEL[order.priority] || order.priority}`, L + 12, afterHeader + 8);

            let y = afterHeader + 44;

            // ── CLIENTE ─────────────────────────────────────────
            const sectionTitle = (title: string, yPos: number) => {
                doc.rect(L, yPos, W, 20).fill('#e5e7eb');
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text(title, L + 8, yPos + 5);
                return yPos + 26;
            };

            const field = (label: string, value: string, xPos: number, yPos: number, w: number) => {
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280').text(label.toUpperCase(), xPos, yPos);
                doc.fontSize(10).font('Helvetica').fillColor('#111827').text(value || '—', xPos, yPos + 10, { width: w - 4 });
            };

            y = sectionTitle('DADOS DO CLIENTE', y);
            const client = (order as any).client;
            field('Nome', client?.nome || '—', L, y, W / 2);
            field('CPF / CNPJ', client?.cpfCnpj || '—', L + W / 2, y, W / 2);
            y += 28;

            const mainContact = client?.contatos?.find((c: any) => c.principal) || client?.contatos?.[0];
            field('Telefone', mainContact?.numero || '—', L, y, W / 2);
            field('E-mail', client?.email || '—', L + W / 2, y, W / 2);
            y += 28;

            const addr = [client?.rua, client?.numero, client?.bairro, client?.cidade, client?.estado].filter(Boolean).join(', ');
            if (addr) {
                field('Endereço', addr, L, y, W);
                y += 28;
            }

            y += 8;

            // ── EQUIPAMENTOS ────────────────────────────────────
            y = sectionTitle('EQUIPAMENTO(S)', y);
            const equipments = (order as any).equipments || [];
            if (equipments.length === 0) {
                doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text('Nenhum equipamento registrado.', L, y);
                y += 20;
            } else {
                equipments.forEach((eq: any, idx: number) => {
                    if (idx > 0) { doc.moveTo(L, y).lineTo(L + W, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke(); y += 6; }
                    field('Tipo', eq.type || '—', L, y, W / 4);
                    field('Marca', eq.brand || '—', L + W / 4, y, W / 4);
                    field('Modelo', eq.model || '—', L + W / 2, y, W / 4);
                    field('Serial / IMEI', eq.serialNumber || '—', L + W * 0.75, y, W / 4);
                    y += 26;
                    field('Defeito Relatado', eq.reportedDefect || '—', L, y, W);
                    y += 26;
                    if (eq.accessories) { field('Acessórios', eq.accessories, L, y, W); y += 26; }
                });
            }
            y += 8;

            // ── DIAGNÓSTICO / LAUDO ─────────────────────────────
            if (order.diagnosis || order.technicalReport) {
                y = sectionTitle('DIAGNÓSTICO / LAUDO TÉCNICO', y);
                if (order.diagnosis) {
                    field('Diagnóstico', '', L, y, W);
                    y += 10;
                    doc.fontSize(10).font('Helvetica').fillColor('#111827').text(order.diagnosis, L, y, { width: W });
                    y += doc.heightOfString(order.diagnosis, { width: W }) + 10;
                }
                if (order.technicalReport) {
                    field('Relatório Técnico', '', L, y, W);
                    y += 10;
                    doc.fontSize(10).font('Helvetica').fillColor('#111827').text(order.technicalReport, L, y, { width: W });
                    y += doc.heightOfString(order.technicalReport, { width: W }) + 10;
                }
                y += 8;
            }

            // ── PEÇAS UTILIZADAS ────────────────────────────────
            const parts = (order as any).parts || [];
            if (parts.length > 0) {
                y = sectionTitle('PEÇAS / SERVIÇOS', y);

                // Cabeçalho da tabela
                doc.rect(L, y, W, 18).fill('#f9fafb');
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
                doc.text('ITEM', L + 4, y + 5, { width: W * 0.45 });
                doc.text('QTD', L + W * 0.5, y + 5, { width: W * 0.1, align: 'center' });
                doc.text('UNITÁRIO', L + W * 0.63, y + 5, { width: W * 0.17, align: 'right' });
                doc.text('TOTAL', L + W * 0.82, y + 5, { width: W * 0.18 - 4, align: 'right' });
                y += 18;

                let subtotal = 0;
                parts.forEach((part: any, idx: number) => {
                    const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
                    const lineTotal = Number(part.unitPrice) * Number(part.quantity);
                    subtotal += lineTotal;
                    doc.rect(L, y, W, 18).fill(bg);
                    doc.fontSize(9).font('Helvetica').fillColor('#111827');
                    const prodName = part.product?.name || `Produto #${part.productId?.slice(0, 8)}`;
                    doc.text(prodName, L + 4, y + 5, { width: W * 0.44 });
                    doc.text(String(part.quantity), L + W * 0.5, y + 5, { width: W * 0.1, align: 'center' });
                    doc.text(fmtCurrency(part.unitPrice), L + W * 0.63, y + 5, { width: W * 0.17, align: 'right' });
                    doc.text(fmtCurrency(lineTotal), L + W * 0.82, y + 5, { width: W * 0.18 - 4, align: 'right' });
                    y += 18;
                });
                y += 4;
            }

            // ── VALORES ─────────────────────────────────────────
            y = sectionTitle('VALORES', y);
            const valueBox = (label: string, val: string, highlight = false) => {
                if (highlight) doc.rect(L, y, W, 24).fill(accentColor);
                const textColor = highlight ? '#ffffff' : '#374151';
                const labelColor = highlight ? '#e5e7eb' : '#6b7280';
                doc.fontSize(9).font('Helvetica').fillColor(labelColor).text(label, L + 8, y + 4);
                doc.fontSize(highlight ? 13 : 11).font('Helvetica-Bold').fillColor(textColor).text(val, L + 8, highlight ? y + 7 : y + 5, { width: W - 16, align: 'right' });
                y += highlight ? 24 : 22;
            };

            if (Number(order.estimatedValue) > 0) valueBox('Valor Estimado', fmtCurrency(order.estimatedValue));
            valueBox('VALOR FINAL', fmtCurrency(order.finalValue || 0), true);
            y += 10;

            // ── TERMOS / ASSINATURA ─────────────────────────────
            // Verificar se cabe na página, senão nova página
            const termsHeight = 120;
            if (y + termsHeight > doc.page.height - 60) {
                doc.addPage();
                y = 40;
            }

            y = sectionTitle('TERMOS DE GARANTIA', y);
            if (serviceTerms) {
                doc.fontSize(7.5).font('Helvetica').fillColor('#4b5563')
                    .text(serviceTerms.replace(/\\n/g, '\n'), L, y, { width: W, lineGap: 2 });
                y += doc.heightOfString(serviceTerms.replace(/\\n/g, '\n'), { width: W, lineGap: 2 }) + 16;
            }

            // Linha de assinatura
            if (y + 60 > doc.page.height - 40) { doc.addPage(); y = 40; }
            doc.moveTo(L, y + 30).lineTo(L + W / 2 - 20, y + 30).strokeColor('#9ca3af').lineWidth(0.5).stroke();
            doc.moveTo(L + W / 2 + 20, y + 30).lineTo(L + W, y + 30).strokeColor('#9ca3af').lineWidth(0.5).stroke();
            doc.fontSize(8).font('Helvetica').fillColor('#9ca3af')
                .text('Assinatura do Cliente', L, y + 34, { width: W / 2 - 20, align: 'center' })
                .text('Assinatura do Técnico', L + W / 2 + 20, y + 34, { width: W / 2 - 20, align: 'center' });

            // Data de entrega
            if (order.exitDate) {
                doc.fontSize(8).fillColor('#6b7280').text(`Data de Entrega: ${fmtDate(order.exitDate)}`, L, y + 46, { width: W, align: 'center' });
            }

            // ── RODAPÉ ──────────────────────────────────────────
            const footerY = doc.page.height - 30;
            doc.rect(0, footerY - 8, doc.page.width, 38).fill('#f3f4f6');
            doc.fontSize(8).font('Helvetica').fillColor('#9ca3af')
                .text(`${name} — Gerado em ${fmtDate(new Date())} — OS #${order.protocol}`, L, footerY, { width: W, align: 'center' });

            doc.end();
        });
    }
}
