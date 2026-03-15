import * as PDFDocument from 'pdfkit';

export interface DanfeData {
    chaveAcesso: string;
    numero: number;
    serie: string;
    dataEmissao: Date;
    emitente: {
        razaoSocial: string;
        cnpj: string;
        endereco: string;
        cidade: string;
        uf: string;
        ie: string;
    };
    destinatario: {
        nome: string;
        cpfCnpj: string;
        endereco: string;
        cidade: string;
        uf: string;
    };
    itens: Array<{
        nItem: number;
        xProd: string;
        quantidade: number;
        vUnCom: number;
        vProd: number;
    }>;
    totais: {
        vProd: number;
        vDesc: number;
        vNF: number;
    };
    protocolo?: string;
    ambiente: number; // 1=Produção, 2=Homologação
    informacoesAdicionais?: string;
}

/**
 * Gera PDF simplificado do DANFE (Documento Auxiliar da NF-e)
 * Retorna Buffer do PDF
 */
export async function gerarDanfe(data: DanfeData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ size: 'A4', margin: 20 });

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const W = doc.page.width - 40; // largura útil

        // ===== Cabeçalho =====
        if (data.ambiente === 2) {
            doc.rect(20, 20, W, 20).fill('#ffcc00');
            doc.fontSize(10).fillColor('#000').font('Helvetica-Bold')
                .text('AMBIENTE DE HOMOLOGAÇÃO — SEM VALOR FISCAL', 20, 25, { align: 'center', width: W });
            doc.y = 45;
        }

        // Box emitente
        doc.rect(20, doc.y, W * 0.5, 60).stroke();
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#000')
            .text(data.emitente.razaoSocial, 25, doc.y + 5, { width: W * 0.5 - 10 });
        doc.fontSize(8).font('Helvetica').fillColor('#333')
            .text(`CNPJ: ${formatDoc(data.emitente.cnpj)}`, 25, doc.y)
            .text(`${data.emitente.endereco} — ${data.emitente.cidade}/${data.emitente.uf}`, 25, doc.y)
            .text(`IE: ${data.emitente.ie}`, 25, doc.y);

        // Box DANFE
        const boxX = 20 + W * 0.5 + 5;
        doc.rect(boxX, 45, W * 0.3, 60).stroke();
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000')
            .text('DANFE', boxX + 5, 50)
            .text('Documento Auxiliar da', boxX + 5, 62)
            .text('Nota Fiscal Eletrônica', boxX + 5, 73);
        doc.fontSize(8).font('Helvetica')
            .text(`Nº: ${String(data.numero).padStart(9, '0')}`, boxX + 5, 88)
            .text(`Série: ${data.serie}`, boxX + 5, 97);

        // Chave de acesso
        doc.y = 110;
        doc.fontSize(7).font('Helvetica')
            .text('CHAVE DE ACESSO:', 20, doc.y)
            .text(formatChave(data.chaveAcesso), 20, doc.y + 10, { align: 'center', width: W });

        // Protocolo
        if (data.protocolo) {
            doc.text(`Protocolo: ${data.protocolo} — ${data.dataEmissao.toLocaleDateString('pt-BR')}`, 20, doc.y + 5, { align: 'center', width: W });
        }

        doc.y += 20;
        doc.moveTo(20, doc.y).lineTo(20 + W, doc.y).stroke();
        doc.y += 5;

        // ===== Destinatário =====
        doc.fontSize(8).font('Helvetica-Bold').text('DESTINATÁRIO / REMETENTE', 20, doc.y);
        doc.fontSize(8).font('Helvetica')
            .text(`Nome: ${data.destinatario.nome}`, 20, doc.y + 10)
            .text(`CPF/CNPJ: ${formatDoc(data.destinatario.cpfCnpj)}`, 20, doc.y + 20)
            .text(`Endereço: ${data.destinatario.endereco}`, 20, doc.y + 30)
            .text(`${data.destinatario.cidade} / ${data.destinatario.uf}`, 20, doc.y + 40);

        doc.y += 55;
        doc.moveTo(20, doc.y).lineTo(20 + W, doc.y).stroke();
        doc.y += 5;

        // ===== Itens =====
        doc.fontSize(8).font('Helvetica-Bold').text('DADOS DOS PRODUTOS / SERVIÇOS', 20, doc.y);
        doc.y += 10;

        // Cabeçalho da tabela
        const cols = [20, 200, 300, 380, 450, 520];
        doc.font('Helvetica-Bold').fontSize(7);
        doc.text('Nº', cols[0], doc.y);
        doc.text('Descrição', cols[1], doc.y);
        doc.text('Qtd', cols[2], doc.y);
        doc.text('V.Unit', cols[3], doc.y);
        doc.text('V.Total', cols[4], doc.y);
        doc.y += 12;
        doc.moveTo(20, doc.y).lineTo(20 + W, doc.y).stroke();
        doc.y += 3;

        doc.font('Helvetica').fontSize(7);
        for (const item of data.itens) {
            if (doc.y > doc.page.height - 100) doc.addPage();
            doc.text(String(item.nItem), cols[0], doc.y);
            doc.text(item.xProd.slice(0, 40), cols[1], doc.y);
            doc.text(item.quantidade.toFixed(2), cols[2], doc.y);
            doc.text(fmtMoney(item.vUnCom), cols[3], doc.y);
            doc.text(fmtMoney(item.vProd), cols[4], doc.y);
            doc.y += 10;
        }

        doc.y += 5;
        doc.moveTo(20, doc.y).lineTo(20 + W, doc.y).stroke();
        doc.y += 5;

        // ===== Totais =====
        doc.fontSize(9).font('Helvetica-Bold')
            .text(`Total Produtos: R$ ${fmtMoney(data.totais.vProd)}`, 20, doc.y, { align: 'right', width: W })
            .text(`Desconto: R$ ${fmtMoney(data.totais.vDesc)}`, 20, doc.y + 12, { align: 'right', width: W })
            .text(`VALOR TOTAL DA NF-e: R$ ${fmtMoney(data.totais.vNF)}`, 20, doc.y + 24, { align: 'right', width: W });

        doc.y += 40;

        // ===== Informações Adicionais =====
        if (data.informacoesAdicionais) {
            doc.fontSize(7).font('Helvetica-Bold').text('INFORMAÇÕES ADICIONAIS:', 20, doc.y);
            doc.font('Helvetica').text(data.informacoesAdicionais, 20, doc.y + 10, { width: W });
        }

        doc.end();
    });
}

function formatDoc(doc: string): string {
    const d = doc.replace(/\D/g, '');
    if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
    return doc;
}

function formatChave(chave: string): string {
    return chave.replace(/(\d{4})/g, '$1 ').trim();
}

function fmtMoney(v: number): string {
    return v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
