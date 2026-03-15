import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { FiscalNota, NotaStatus, NotaTipo } from './entities/fiscal-nota.entity';
import { FiscalProduto } from './entities/fiscal-produto.entity';
import { FiscalServico } from './entities/fiscal-servico.entity';
import { FiscalCliente } from './entities/fiscal-cliente.entity';
import { EmitNFeDto } from './dto/emit-nfe.dto';
import { EmitNFSeDto } from './dto/emit-nfse.dto';
import { WebhookPagamentoDto } from './dto/webhook-pagamento.dto';

import { buildNFeXmlComplete, NFeData } from './nfe/nfe-xml.builder';
import { loadCertificateFromPfx, signNFeXml } from './nfe/nfe-signer';
import { enviarNFe, consultarRetornoNFe, enviarEvento } from './nfe/nfe-soap.client';
import { parseSefazResponse } from './nfe/nfe-response.parser';
import { gerarDanfe } from './danfe/danfe.generator';
import { NfseAdapterFactory, NfsePattern, detectNfsePattern } from './nfse/nfse-adapter.factory';
import { FiscalError, FiscalErrorCode } from './fiscal.errors';
import { validateCpfOrCnpj } from './validators/cpf-cnpj.validator';

@Injectable()
export class FiscalService {
    private readonly logger = new Logger(FiscalService.name);

    constructor(
        @InjectRepository(FiscalNota)
        private notaRepo: Repository<FiscalNota>,

        @InjectRepository(FiscalProduto)
        private produtoRepo: Repository<FiscalProduto>,

        @InjectRepository(FiscalServico)
        private servicoRepo: Repository<FiscalServico>,

        @InjectRepository(FiscalCliente)
        private clienteRepo: Repository<FiscalCliente>,

        private readonly dataSource: DataSource,
        private readonly config: ConfigService,
        private readonly nfseFactory: NfseAdapterFactory,
    ) { }

    // =====================================================================
    //  CONFIG DO EMITENTE (via .env)
    // =====================================================================

    private getEmitenteConfig() {
        return {
            cnpj: this.config.get<string>('FISCAL_EMITENTE_CNPJ', '00000000000000'),
            razaoSocial: this.config.get<string>('FISCAL_EMITENTE_RAZAO_SOCIAL', 'EMPRESA LTDA'),
            nomeFantasia: this.config.get<string>('FISCAL_EMITENTE_NOME_FANTASIA', ''),
            logradouro: this.config.get<string>('FISCAL_EMITENTE_LOGRADOURO', 'Rua Exemplo'),
            numero: this.config.get<string>('FISCAL_EMITENTE_NUMERO', '100'),
            bairro: this.config.get<string>('FISCAL_EMITENTE_BAIRRO', 'Centro'),
            cMun: this.config.get<string>('FISCAL_EMITENTE_COD_IBGE', '4205407'),
            xMun: this.config.get<string>('FISCAL_EMITENTE_MUNICIPIO', 'Florianopolis'),
            uf: this.config.get<string>('FISCAL_EMITENTE_UF', 'SC'),
            cep: this.config.get<string>('FISCAL_EMITENTE_CEP', '88000000'),
            cPais: '1058',
            xPais: 'Brasil',
            fone: this.config.get<string>('FISCAL_EMITENTE_FONE', ''),
            ie: this.config.get<string>('FISCAL_EMITENTE_IE', ''),
            crt: this.config.get<string>('FISCAL_EMITENTE_CRT', '1'), // 1=Simples
            im: this.config.get<string>('FISCAL_EMITENTE_IM', ''), // Inscrição Municipal
        };
    }

    private getCertificate() {
        const pfxPath = this.config.get<string>('FISCAL_CERT_PATH', '');
        const pfxPassword = this.config.get<string>('FISCAL_CERT_PASSWORD', '');
        if (!pfxPath || !pfxPassword) {
            throw new FiscalError('Certificado não configurado. Defina FISCAL_CERT_PATH e FISCAL_CERT_PASSWORD', FiscalErrorCode.CERTIFICATE_INVALID);
        }
        return loadCertificateFromPfx(pfxPath, pfxPassword);
    }

    private getAmbiente(dto?: { ambiente?: number }): number {
        const envConfig = this.config.get<string>('FISCAL_AMBIENTE', '2');
        return dto?.ambiente ?? parseInt(envConfig);
    }

    // =====================================================================
    //  NF-e — PRODUTO
    // =====================================================================

    async emitirNFe(dto: EmitNFeDto): Promise<FiscalNota> {
        this.logger.log(`Iniciando emissão NF-e para cliente ${dto.clienteId}, ${dto.itens.length} itens`);

        // Validar cliente
        const cliente = await this.clienteRepo.findOne({ where: { id: dto.clienteId } });
        if (!cliente) throw new FiscalError('Cliente fiscal não encontrado', FiscalErrorCode.NOTA_NOT_FOUND);

        if (!validateCpfOrCnpj(cliente.cpfCnpj)) {
            throw new FiscalError(`CPF/CNPJ inválido: ${cliente.cpfCnpj}`, FiscalErrorCode.INVALID_CPF_CNPJ);
        }

        // Buscar produtos
        const produtos: Array<{ produto: FiscalProduto; quantidade: number; valorUnitario: number; desconto?: number }> = [];
        for (const item of dto.itens) {
            const prod = await this.produtoRepo.findOne({ where: { id: item.produtoId } });
            if (!prod) throw new FiscalError(`Produto ${item.produtoId} não encontrado`, FiscalErrorCode.NOTA_NOT_FOUND);
            produtos.push({ produto: prod, quantidade: item.quantidade, valorUnitario: item.valorUnitario, desconto: item.desconto });
        }

        // Calcular próximo número
        const lastNota = await this.notaRepo.findOne({ where: { tipo: NotaTipo.PRODUTO }, order: { numero: 'DESC' } });
        const numero = (lastNota?.numero ?? 0) + 1;

        const emitente = this.getEmitenteConfig();
        const ambiente = this.getAmbiente(dto);
        const cert = this.getCertificate();

        const nfeData: NFeData = {
            numero,
            serie: '001',
            ambiente,
            emitente,
            cliente,
            itens: produtos,
            informacoesAdicionais: dto.informacoesAdicionais,
            finalidade: dto.finalidade,
        };

        // Construir XML
        let xml: string;
        let chaveAcesso: string;
        try {
            const built = buildNFeXmlComplete(nfeData);
            xml = built.xml;
            chaveAcesso = built.chaveAcesso;
            this.logger.log(`XML NF-e construído. Chave: ${chaveAcesso}`);
        } catch (err) {
            throw new FiscalError(`Falha ao construir XML: ${(err as Error).message}`, FiscalErrorCode.XML_BUILD_FAILED, err);
        }

        // Assinar
        let xmlAssinado: string;
        try {
            xmlAssinado = signNFeXml(xml, cert);
            this.logger.log('XML NF-e assinado com sucesso');
        } catch (err) {
            throw new FiscalError(`Falha na assinatura: ${(err as Error).message}`, FiscalErrorCode.SIGNATURE_FAILED, err);
        }

        // Criar registro pendente
        const nota = this.notaRepo.create({
            tipo: NotaTipo.PRODUTO,
            status: NotaStatus.PENDENTE,
            numero,
            serie: '001',
            ambiente,
            xmlEnvio: xmlAssinado,
            chaveAcesso,
            orderId: dto.orderId,
            clienteId: dto.clienteId,
            valorTotal: produtos.reduce((s, i) => s + i.quantidade * i.valorUnitario - (i.desconto || 0), 0),
            itensJson: JSON.stringify(dto.itens),
        });
        await this.notaRepo.save(nota);

        // Enviar para SEFAZ
        try {
            const sefazConfig = { uf: emitente.uf, ambiente, certPem: cert.certPem, keyPem: cert.keyPem };
            const sefazResponse = await enviarNFe(xmlAssinado, sefazConfig);
            const parsed = parseSefazResponse(sefazResponse.xmlRetorno ?? '');

            nota.xmlRetorno = sefazResponse.xmlRetorno;
            nota.cStat = parsed.cStat;
            nota.xMotivo = parsed.xMotivo;
            nota.recibo = parsed.recibo;

            if (parsed.autorizado) {
                nota.status = NotaStatus.AUTORIZADA;
                nota.protocolo = parsed.protocolo;
                this.logger.log(`NF-e ${chaveAcesso} AUTORIZADA. Protocolo: ${parsed.protocolo}`);
                await this.notaRepo.save(nota);
                await this.processarPostAutorizacao(nota, produtos);
            } else if (parsed.emProcessamento) {
                nota.status = NotaStatus.AGUARDANDO;
                await this.notaRepo.save(nota);
                this.logger.log(`NF-e ${chaveAcesso} em processamento. Recibo: ${parsed.recibo}`);
                // Consulta assíncrona será feita por polling
                setTimeout(() => this.consultarRetorno(nota.id, sefazConfig), 5000);
            } else {
                nota.status = NotaStatus.REJEITADA;
                nota.erroDetalhes = `cStat: ${parsed.cStat} — ${parsed.xMotivo}`;
                await this.notaRepo.save(nota);
                this.logger.warn(`NF-e ${chaveAcesso} REJEITADA: ${parsed.cStat} — ${parsed.xMotivo}`);
            }
        } catch (err) {
            nota.status = NotaStatus.REJEITADA;
            nota.erroDetalhes = (err as Error).message;
            await this.notaRepo.save(nota);
            this.logger.error(`Erro ao enviar NF-e para SEFAZ: ${(err as Error).message}`, (err as Error).stack);
        }

        return nota;
    }

    /**
     * Consulta retorno de nota em processamento via recibo
     */
    async consultarRetorno(notaId: string, sefazConfig?: any): Promise<FiscalNota> {
        const nota = await this.notaRepo.findOne({ where: { id: notaId } });
        if (!nota || !nota.recibo) return nota!;

        const emitente = this.getEmitenteConfig();
        const cert = this.getCertificate();
        const config = sefazConfig ?? { uf: emitente.uf, ambiente: nota.ambiente, certPem: cert.certPem, keyPem: cert.keyPem };

        try {
            const response = await consultarRetornoNFe(nota.recibo, config);
            const parsed = parseSefazResponse(response.xmlRetorno ?? '');

            nota.cStat = parsed.cStat;
            nota.xMotivo = parsed.xMotivo;
            nota.xmlRetorno = response.xmlRetorno;

            if (parsed.autorizado) {
                nota.status = NotaStatus.AUTORIZADA;
                nota.protocolo = parsed.protocolo;
                await this.notaRepo.save(nota);
                const itens = JSON.parse(nota.itensJson || '[]');
                await this.processarPostAutorizacao(nota, itens);
            } else if (parsed.rejeitado) {
                nota.status = NotaStatus.REJEITADA;
                await this.notaRepo.save(nota);
            }
        } catch (err) {
            this.logger.error(`Erro ao consultar retorno: ${(err as Error).message}`);
        }

        return nota;
    }

    /**
     * Ações após autorização: baixar estoque + enviar DANFE
     */
    private async processarPostAutorizacao(nota: FiscalNota, itens: any[]): Promise<void> {
        await this.baixarEstoqueTransacional(nota, itens);
        await this.gerarEEnviarDanfe(nota);
    }

    // =====================================================================
    //  NFS-e — SERVIÇO
    // =====================================================================

    async emitirNFSe(dto: EmitNFSeDto): Promise<FiscalNota> {
        this.logger.log(`Iniciando emissão NFS-e para cliente ${dto.clienteId}`);

        const cliente = await this.clienteRepo.findOne({ where: { id: dto.clienteId } });
        if (!cliente) throw new FiscalError('Cliente fiscal não encontrado', FiscalErrorCode.NOTA_NOT_FOUND);

        const servico = await this.servicoRepo.findOne({ where: { id: dto.servicoId } });
        if (!servico) throw new FiscalError('Serviço não encontrado', FiscalErrorCode.NOTA_NOT_FOUND);

        const nota = this.notaRepo.create({
            tipo: NotaTipo.SERVICO,
            status: NotaStatus.PENDENTE,
            ambiente: this.getAmbiente(dto),
            orderId: dto.orderId,
            clienteId: dto.clienteId,
            valorTotal: dto.valor,
        });
        await this.notaRepo.save(nota);

        try {
            const pattern = detectNfsePattern(cliente.codigoIbge || '4205407');
            const adapter = this.nfseFactory.getAdapter(pattern);
            const emitente = this.getEmitenteConfig();
            const cert = this.getCertificate();

            const result = await adapter.emitir(cliente, servico, {
                pattern,
                codigoMunicipio: cliente.codigoIbge || emitente.cMun,
                inscricaoMunicipal: emitente.im,
                cert,
                ambiente: nota.ambiente,
                urlWsdl: this.config.get('FISCAL_NFSE_URL'),
            }, dto.valor, dto.discriminacao);

            nota.xmlRetorno = result.xmlRetorno;
            nota.protocolo = result.protocolo;
            nota.status = result.autorizado ? NotaStatus.AUTORIZADA : NotaStatus.REJEITADA;
            nota.xMotivo = result.mensagem;

            if (result.autorizado) {
                this.logger.log(`NFS-e autorizada. Número: ${result.numero}`);
            } else {
                this.logger.warn(`NFS-e rejeitada: ${result.mensagem}`);
            }
        } catch (err) {
            nota.status = NotaStatus.REJEITADA;
            nota.erroDetalhes = (err as Error).message;
            this.logger.error(`Erro ao emitir NFS-e: ${(err as Error).message}`);
        }

        return this.notaRepo.save(nota);
    }

    // =====================================================================
    //  WEBHOOK DE PAGAMENTO
    // =====================================================================

    async processarWebhookPagamento(dto: WebhookPagamentoDto): Promise<{ message: string; nota?: FiscalNota }> {
        this.logger.log(`Webhook recebido: evento=${dto.event}, orderId=${dto.orderId}, valor=${dto.amount}`);

        const pagamentoConfirmado =
            dto.event === 'payment.confirmed' ||
            dto.event === 'payment.approved' ||
            dto.event === 'pix.received';

        if (!pagamentoConfirmado) {
            this.logger.log(`Evento ${dto.event} ignorado — não é confirmação de pagamento`);
            return { message: 'Evento ignorado' };
        }

        if (!dto.orderId || !dto.clienteId) {
            this.logger.warn('Webhook sem orderId ou clienteId — emissão de nota não disparada');
            return { message: 'orderId ou clienteId ausente — nota não emitida' };
        }

        // Verificar se já existe nota para esse pedido
        const existente = await this.notaRepo.findOne({
            where: { orderId: dto.orderId, status: NotaStatus.AUTORIZADA },
        });
        if (existente) {
            this.logger.log(`Já existe nota autorizada para o pedido ${dto.orderId}`);
            return { message: 'Nota já emitida', nota: existente };
        }

        try {
            const nota = await this.emitirNFe({
                clienteId: dto.clienteId,
                itens: dto.metadata?.itens || [],
                orderId: dto.orderId,
                ambiente: this.getAmbiente(),
            });

            return { message: 'Nota processada', nota };
        } catch (err) {
            this.logger.error(`Erro ao emitir nota pelo webhook: ${(err as Error).message}`);
            return { message: `Erro na emissão: ${(err as Error).message}` };
        }
    }

    // =====================================================================
    //  ESTOQUE TRANSACIONAL
    // =====================================================================

    /**
     * Baixa estoque apenas quando cStat=100 (AUTORIZADA)
     * Usa transaction PostgreSQL com rollback automático
     */
    private async baixarEstoqueTransacional(nota: FiscalNota, itens: any[]): Promise<void> {
        if (!itens?.length) return;

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const item of itens) {
                if (!item.produtoId || !item.quantidade) continue;

                const produto = await queryRunner.manager.findOne(FiscalProduto, {
                    where: { id: item.produtoId },
                    lock: { mode: 'pessimistic_write' },
                });

                if (!produto) {
                    this.logger.warn(`Produto ${item.produtoId} não encontrado no estoque fiscal`);
                    continue;
                }

                const estoqueAtual = Number(produto.estoque);
                const quantidade = Number(item.quantidade);

                if (estoqueAtual < quantidade) {
                    this.logger.warn(`Estoque insuficiente para ${produto.nome}: ${estoqueAtual} < ${quantidade}. Continuando mesmo assim.`);
                }

                produto.estoque = Math.max(0, estoqueAtual - quantidade);
                await queryRunner.manager.save(FiscalProduto, produto);

                this.logger.log(`Estoque baixado: ${produto.nome} ${estoqueAtual} → ${produto.estoque} (NF-e: ${nota.chaveAcesso})`);
            }

            await queryRunner.commitTransaction();
            this.logger.log(`Baixa de estoque concluída para NF-e ${nota.chaveAcesso}`);
        } catch (err) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Rollback de estoque executado: ${(err as Error).message}`);
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    // =====================================================================
    //  DANFE + EMAIL
    // =====================================================================

    private async gerarEEnviarDanfe(nota: FiscalNota): Promise<void> {
        try {
            const cliente = await this.clienteRepo.findOne({ where: { id: nota.clienteId } });
            const emitente = this.getEmitenteConfig();
            const itens = JSON.parse(nota.itensJson || '[]');

            const danfePdf = await gerarDanfe({
                chaveAcesso: nota.chaveAcesso || '',
                numero: nota.numero || 0,
                serie: nota.serie || '001',
                dataEmissao: nota.createdAt || new Date(),
                emitente: {
                    razaoSocial: emitente.razaoSocial,
                    cnpj: emitente.cnpj,
                    endereco: `${emitente.logradouro}, ${emitente.numero}`,
                    cidade: emitente.xMun,
                    uf: emitente.uf,
                    ie: emitente.ie,
                },
                destinatario: {
                    nome: cliente?.nome || 'Consumidor',
                    cpfCnpj: cliente?.cpfCnpj || '',
                    endereco: cliente?.endereco || '',
                    cidade: cliente?.cidade || '',
                    uf: cliente?.uf || '',
                },
                itens: itens.map((item: any, i: number) => ({
                    nItem: i + 1,
                    xProd: item.nome || item.produtoId,
                    quantidade: item.quantidade,
                    vUnCom: item.valorUnitario,
                    vProd: item.quantidade * item.valorUnitario,
                })),
                totais: {
                    vProd: nota.valorTotal,
                    vDesc: 0,
                    vNF: nota.valorTotal,
                },
                protocolo: nota.protocolo,
                ambiente: nota.ambiente,
            });

            nota.danfePdf = danfePdf.toString('base64');
            await this.notaRepo.save(nota);

            if (cliente?.email) {
                await this.enviarEmailDanfe(cliente.email, cliente.nome, danfePdf, nota);
            }
        } catch (err) {
            this.logger.error(`Erro ao gerar/enviar DANFE: ${(err as Error).message}`);
        }
    }

    private async enviarEmailDanfe(email: string, nome: string, pdf: Buffer, nota: FiscalNota): Promise<void> {
        const host = this.config.get<string>('SMTP_HOST');
        if (!host) {
            this.logger.warn('SMTP não configurado — DANFE não enviado por email');
            return;
        }

        const transporter = nodemailer.createTransport({
            host,
            port: this.config.get<number>('SMTP_PORT', 587),
            secure: false,
            auth: {
                user: this.config.get<string>('SMTP_USER'),
                pass: this.config.get<string>('SMTP_PASS'),
            },
        });

        try {
            await transporter.sendMail({
                from: `"${this.getEmitenteConfig().razaoSocial}" <${this.config.get('SMTP_FROM')}>`,
                to: email,
                subject: `DANFE — NF-e nº ${nota.numero} — ${this.getEmitenteConfig().razaoSocial}`,
                html: `<p>Olá, ${nome}!</p><p>Segue em anexo o DANFE da NF-e nº ${nota.numero}.</p><p>Protocolo: ${nota.protocolo}</p>`,
                attachments: [
                    { filename: `DANFE_${nota.numero}.pdf`, content: pdf, contentType: 'application/pdf' },
                    ...(nota.xmlRetorno ? [{ filename: `NFe_${nota.chaveAcesso}.xml`, content: nota.xmlRetorno }] : []),
                ],
            });
            this.logger.log(`DANFE enviado para ${email}`);
        } catch (err) {
            this.logger.error(`Falha ao enviar email para ${email}: ${(err as Error).message}`);
            throw new FiscalError('Falha ao enviar email com DANFE', FiscalErrorCode.EMAIL_SEND_FAILED, err);
        }
    }

    // =====================================================================
    //  CANCELAMENTO E CARTA DE CORREÇÃO
    // =====================================================================

    async cancelarNota(notaId: string, justificativa: string): Promise<FiscalNota> {
        const nota = await this.notaRepo.findOne({ where: { id: notaId } });
        if (!nota) throw new FiscalError('Nota não encontrada', FiscalErrorCode.NOTA_NOT_FOUND);
        if (nota.status !== NotaStatus.AUTORIZADA) {
            throw new FiscalError('Só é possível cancelar notas autorizadas', FiscalErrorCode.SEFAZ_ERROR);
        }

        const emitente = this.getEmitenteConfig();
        const cert = this.getCertificate();

        const response = await enviarEvento({
            chaveAcesso: nota.chaveAcesso!,
            tpEvento: '110111',
            xJust: justificativa,
            config: { uf: emitente.uf, ambiente: nota.ambiente, certPem: cert.certPem, keyPem: cert.keyPem },
            cnpjEmitente: emitente.cnpj,
        });

        const parsed = parseSefazResponse(response.xmlRetorno ?? '');
        if (parsed.cStat === 135 || parsed.cStat === 101) {
            nota.status = NotaStatus.CANCELADA;
            nota.xMotivo = `Cancelada: ${parsed.xMotivo}`;
            this.logger.log(`NF-e ${nota.chaveAcesso} cancelada com sucesso`);
        } else {
            this.logger.warn(`Cancelamento rejeitado: ${parsed.cStat} — ${parsed.xMotivo}`);
            nota.xMotivo = `Cancelamento rejeitado: ${parsed.xMotivo}`;
        }

        return this.notaRepo.save(nota);
    }

    async cartaCorrecao(notaId: string, correcao: string): Promise<FiscalNota> {
        const nota = await this.notaRepo.findOne({ where: { id: notaId } });
        if (!nota) throw new FiscalError('Nota não encontrada', FiscalErrorCode.NOTA_NOT_FOUND);

        const emitente = this.getEmitenteConfig();
        const cert = this.getCertificate();

        await enviarEvento({
            chaveAcesso: nota.chaveAcesso!,
            tpEvento: '110110',
            xCorrecao: correcao,
            config: { uf: emitente.uf, ambiente: nota.ambiente, certPem: cert.certPem, keyPem: cert.keyPem },
            cnpjEmitente: emitente.cnpj,
        });

        this.logger.log(`CC-e enviada para NF-e ${nota.chaveAcesso}`);
        return nota;
    }

    // =====================================================================
    //  CONSULTAS / CRUD
    // =====================================================================

    async findAllNotas(): Promise<FiscalNota[]> {
        return this.notaRepo.find({ order: { createdAt: 'DESC' } });
    }

    async findNotaById(id: string): Promise<FiscalNota> {
        const nota = await this.notaRepo.findOne({ where: { id } });
        if (!nota) throw new FiscalError('Nota não encontrada', FiscalErrorCode.NOTA_NOT_FOUND);
        return nota;
    }

    async getDanfePdf(notaId: string): Promise<Buffer> {
        const nota = await this.findNotaById(notaId);
        if (!nota.danfePdf) throw new FiscalError('DANFE não disponível', FiscalErrorCode.NOTA_NOT_FOUND);
        return Buffer.from(nota.danfePdf, 'base64');
    }

    // CRUD Clientes Fiscais
    async findOrCreateClienteFiscal(data: Partial<FiscalCliente>): Promise<FiscalCliente> {
        if (data.cpfCnpj && !validateCpfOrCnpj(data.cpfCnpj)) {
            throw new FiscalError(`CPF/CNPJ inválido: ${data.cpfCnpj}`, FiscalErrorCode.INVALID_CPF_CNPJ);
        }
        if (data.cpfCnpj) {
            const existing = await this.clienteRepo.findOne({ where: { cpfCnpj: data.cpfCnpj.replace(/\D/g, '') } });
            if (existing) return Object.assign(existing, data) && this.clienteRepo.save(Object.assign(existing, data));
        }
        const cliente = this.clienteRepo.create({ ...data, cpfCnpj: data.cpfCnpj?.replace(/\D/g, '') });
        return this.clienteRepo.save(cliente);
    }

    async findAllClientes(): Promise<FiscalCliente[]> {
        return this.clienteRepo.find({ order: { nome: 'ASC' } });
    }

    // CRUD Produtos Fiscais
    async createProdutoFiscal(data: Partial<FiscalProduto>): Promise<FiscalProduto> {
        const produto = this.produtoRepo.create(data);
        return this.produtoRepo.save(produto);
    }

    async findAllProdutos(): Promise<FiscalProduto[]> {
        return this.produtoRepo.find({ order: { nome: 'ASC' } });
    }

    // CRUD Serviços Fiscais
    async createServico(data: Partial<FiscalServico>): Promise<FiscalServico> {
        const servico = this.servicoRepo.create(data);
        return this.servicoRepo.save(servico);
    }

    async findAllServicos(): Promise<FiscalServico[]> {
        return this.servicoRepo.find({ order: { descricao: 'ASC' } });
    }
}
