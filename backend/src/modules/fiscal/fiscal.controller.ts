import {
    Controller, Post, Get, Param, Body, Res, HttpCode, HttpStatus, Logger,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FiscalService } from './fiscal.service';
import { EmitNFeDto } from './dto/emit-nfe.dto';
import { EmitNFSeDto } from './dto/emit-nfse.dto';
import { WebhookPagamentoDto } from './dto/webhook-pagamento.dto';
import { FiscalCliente } from './entities/fiscal-cliente.entity';
import { FiscalProduto } from './entities/fiscal-produto.entity';
import { FiscalServico } from './entities/fiscal-servico.entity';
import { FiscalError } from './fiscal.errors';

@Controller('fiscal')
export class FiscalController {
    private readonly logger = new Logger(FiscalController.name);

    constructor(private readonly fiscalService: FiscalService) { }

    // =====================================================================
    //  NF-e
    // =====================================================================

    /** POST /fiscal/nfe — Emitir NF-e de produto */
    @Post('nfe')
    @UseGuards(JwtAuthGuard)
    async emitirNFe(@Body() dto: EmitNFeDto) {
        try {
            const nota = await this.fiscalService.emitirNFe(dto);
            return { success: true, nota };
        } catch (err) {
            return this.handleError(err);
        }
    }

    /** GET /fiscal/nfe/:id/consultar — Consultar retorno por recibo */
    @Get('nfe/:id/consultar')
    @UseGuards(JwtAuthGuard)
    async consultarRetorno(@Param('id') id: string) {
        try {
            const nota = await this.fiscalService.consultarRetorno(id);
            return { success: true, nota };
        } catch (err) {
            return this.handleError(err);
        }
    }

    /** POST /fiscal/nfe/:id/cancelar — Cancelamento (evento 110111) */
    @Post('nfe/:id/cancelar')
    @UseGuards(JwtAuthGuard)
    async cancelar(@Param('id') id: string, @Body() body: { justificativa: string }) {
        try {
            const nota = await this.fiscalService.cancelarNota(id, body.justificativa);
            return { success: true, nota };
        } catch (err) {
            return this.handleError(err);
        }
    }

    /** POST /fiscal/nfe/:id/carta-correcao — Carta de correção (evento 110110) */
    @Post('nfe/:id/carta-correcao')
    @UseGuards(JwtAuthGuard)
    async cartaCorrecao(@Param('id') id: string, @Body() body: { correcao: string }) {
        try {
            const nota = await this.fiscalService.cartaCorrecao(id, body.correcao);
            return { success: true, nota };
        } catch (err) {
            return this.handleError(err);
        }
    }

    /** GET /fiscal/nfe/:id/danfe — Download PDF do DANFE */
    @Get('nfe/:id/danfe')
    @UseGuards(JwtAuthGuard)
    async downloadDanfe(@Param('id') id: string, @Res() res: Response) {
        try {
            const pdf = await this.fiscalService.getDanfePdf(id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="DANFE_${id}.pdf"`);
            res.send(pdf);
        } catch (err) {
            res.status(404).json({ error: (err as Error).message });
        }
    }

    // =====================================================================
    //  NFS-e
    // =====================================================================

    /** POST /fiscal/nfse — Emitir NFS-e de serviço */
    @Post('nfse')
    @UseGuards(JwtAuthGuard)
    async emitirNFSe(@Body() dto: EmitNFSeDto) {
        try {
            const nota = await this.fiscalService.emitirNFSe(dto);
            return { success: true, nota };
        } catch (err) {
            return this.handleError(err);
        }
    }

    // =====================================================================
    //  WEBHOOK PAGAMENTO (sem JWT — autenticação via secret no header)
    // =====================================================================

    /** POST /fiscal/webhook/pagamento — Disparado pelo gateway de pagamento */
    @Post('webhook/pagamento')
    @HttpCode(HttpStatus.OK)
    async webhookPagamento(@Body() dto: WebhookPagamentoDto) {
        this.logger.log(`Webhook pagamento: ${JSON.stringify(dto)}`);
        try {
            const result = await this.fiscalService.processarWebhookPagamento(dto);
            return result;
        } catch (err) {
            this.logger.error(`Erro no webhook: ${(err as Error).message}`);
            return { message: 'Erro interno processado — fluxo não interrompido' };
        }
    }

    // =====================================================================
    //  LISTAGEM DE NOTAS
    // =====================================================================

    /** GET /fiscal/notas — Listar todas as notas */
    @Get('notas')
    @UseGuards(JwtAuthGuard)
    async findAll() {
        return this.fiscalService.findAllNotas();
    }

    /** GET /fiscal/notas/:id — Detalhe de uma nota */
    @Get('notas/:id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        return this.fiscalService.findNotaById(id);
    }

    // =====================================================================
    //  CLIENTES FISCAIS
    // =====================================================================

    @Get('clientes')
    @UseGuards(JwtAuthGuard)
    async findClientes() { return this.fiscalService.findAllClientes(); }

    @Post('clientes')
    @UseGuards(JwtAuthGuard)
    async createCliente(@Body() data: Partial<FiscalCliente>) {
        try {
            return await this.fiscalService.findOrCreateClienteFiscal(data);
        } catch (err) { return this.handleError(err); }
    }

    // =====================================================================
    //  PRODUTOS FISCAIS
    // =====================================================================

    @Get('produtos')
    @UseGuards(JwtAuthGuard)
    async findProdutos() { return this.fiscalService.findAllProdutos(); }

    @Post('produtos')
    @UseGuards(JwtAuthGuard)
    async createProduto(@Body() data: Partial<FiscalProduto>) {
        return this.fiscalService.createProdutoFiscal(data);
    }

    // =====================================================================
    //  SERVIÇOS FISCAIS
    // =====================================================================

    @Get('servicos')
    @UseGuards(JwtAuthGuard)
    async findServicos() { return this.fiscalService.findAllServicos(); }

    @Post('servicos')
    @UseGuards(JwtAuthGuard)
    async createServico(@Body() data: Partial<FiscalServico>) {
        return this.fiscalService.createServico(data);
    }

    // =====================================================================
    //  HELPER
    // =====================================================================

    private handleError(err: unknown) {
        if (err instanceof FiscalError) {
            return { success: false, error: err.message, code: err.code, details: err.details };
        }
        return { success: false, error: (err as Error).message };
    }
}
