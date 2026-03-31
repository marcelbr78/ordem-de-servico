import {
    Controller, Get, Post, Patch, Param, Body,
    Query, UseGuards, Req, UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WarrantiesService } from './warranties.service';
import {
    CreateWarrantyReturnDto,
    EvaluateWarrantyReturnDto,
    DecideWarrantyReturnDto,
} from './dto/create-warranty-return.dto';
import { CreateWarrantyRefundDto, AuthorizeRefundDto } from './dto/create-warranty-refund.dto';
import { TechnicalMemory } from './entities/technical-memory.entity';

@Controller('warranties')
@UseGuards(JwtAuthGuard)
export class WarrantiesController {
    constructor(private readonly service: WarrantiesService) {}

    // ── WARRANTY RETURNS ─────────────────────────────────────────────────────

    @Get('returns')
    findAllReturns(@Query('status') status: string, @Req() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.service.findAllReturns(tenantId, status);
    }

    @Get('returns/order/:orderId')
    findReturnsByOrder(@Param('orderId') orderId: string, @Req() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.service.findReturnsByOrder(orderId, tenantId);
    }

    @Get('returns/:id')
    findReturnById(@Param('id') id: string, @Req() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.service.findReturnById(id, tenantId);
    }

    @Post('returns')
    createReturn(@Body() dto: CreateWarrantyReturnDto, @Req() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.service.createReturn(dto, req.user, tenantId);
    }

    @Patch('returns/:id/evaluate')
    evaluateReturn(
        @Param('id') id: string,
        @Body() dto: EvaluateWarrantyReturnDto,
        @Req() req,
    ) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.service.evaluateReturn(id, dto, req.user, tenantId);
    }

    @Patch('returns/:id/decide')
    decideReturn(
        @Param('id') id: string,
        @Body() dto: DecideWarrantyReturnDto,
        @Req() req,
    ) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.service.decideReturn(id, dto, req.user, tenantId);
    }

    @Patch('returns/:id/complete')
    completeReturn(@Param('id') id: string, @Req() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.service.completeReturn(id, tenantId, req.user);
    }

    // ── WARRANTY REFUNDS ─────────────────────────────────────────────────────

    @Get('refunds')
    findAllRefunds(@Query('status') status: string, @Req() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.service.findAllRefunds(tenantId, status);
    }

    @Post('refunds')
    createRefund(@Body() dto: CreateWarrantyRefundDto, @Req() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.service.createRefund(dto, req.user, tenantId);
    }

    @Patch('refunds/:id/authorize')
    authorizeRefund(
        @Param('id') id: string,
        @Body() dto: AuthorizeRefundDto,
        @Req() req,
    ) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.service.authorizeRefund(id, dto, req.user, tenantId);
    }

    // ── TECHNICAL MEMORY ─────────────────────────────────────────────────────

    @Get('memory')
    searchMemory(
        @Query('brand') brand: string,
        @Query('model') model: string,
        @Query('symptom') symptom: string,
        @Req() req,
    ) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.service.searchMemory(tenantId, brand, model, symptom);
    }

    @Post('memory')
    createMemory(@Body() dto: Partial<TechnicalMemory>, @Req() req) {
        const tenantId = req.user.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant não identificado');
        return this.service.createMemory(dto, tenantId);
    }
}
