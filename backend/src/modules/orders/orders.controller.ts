import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, UseInterceptors, UploadedFile, Delete, Query, UsePipes, ValidationPipe, HttpException, Res } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { UpdateOrderServiceDto } from './dto/update-order-service.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { OrderPdfService } from './pdf/order-pdf.service';
import { ConversationService } from './conversation.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly pdfService: OrderPdfService,
        private readonly conversationService: ConversationService,
    ) { }

    @Post()
    create(@Body() createOrderDto: CreateOrderServiceDto, @Req() req) {
        return this.ordersService.create(createOrderDto, req.user?.id, req.user?.tenantId);
    }

    @Get('dashboard')
    getDashboard(@Req() req) {
        return this.ordersService.getDashboardStats(req.user?.tenantId);
    }

    @Get('warranty')
    getWarranty(@Req() req) {
        return this.ordersService.getWarrantyOrders(req.user?.tenantId);
    }

    @Get()
    findAll(@Query('deleted') deleted?: string, @Req() req?) {
        return this.ordersService.findAll(deleted === 'true', req?.user?.tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Get('client/:id')
    findByClient(@Param('id') id: string, @Req() req) {
        return this.ordersService.findByClient(id, req.user?.tenantId);
    }

    @Get('equipment/lookup/:serial')
    lookupBySerial(@Param('serial') serial: string) {
        return this.ordersService.lookupBySerial(serial);
    }

    @Patch(':id')
    @UsePipes(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: false }))
    async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
        try {
            return await this.ordersService.update(id, body as any);
        } catch (err: any) {
            console.error('[Orders PATCH] Error updating order:', err?.message, err?.stack);
            throw err;
        }
    }

    @Patch(':id/status')
    changeStatus(
        @Param('id') id: string,
        @Body() changeStatusDto: ChangeStatusDto,
        @Req() req
    ) {
        return this.ordersService.changeStatus(id, changeStatusDto, req.user?.id, req.user?.tenantId);
    }

    @Post(':id/images')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        return this.ordersService.addPhoto(id, file);
    }

    @Delete('images/:id')
    async removeImage(@Param('id') id: string) {
        return this.ordersService.removePhoto(id);
    }

    @Post(':id/share')
    async shareOrder(
        @Param('id') id: string,
        @Body() body: { type: 'entry' | 'exit' | 'update', origin?: string, customNumber?: string, message?: string },
        @Req() req
    ) {
        return this.ordersService.shareOrder(id, {
            type: body.type,
            origin: body.origin,
            customNumber: body.customNumber,
            userId: req.user?.id,
            message: body.message
        });
    }

    @Post(':id/parts')
    @UsePipes(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: false }))
    async addPart(@Param('id') id: string, @Body() partData: Record<string, unknown>) {
        try {
            console.log('[Orders addPart] orderId:', id, 'body:', JSON.stringify(partData));
            return await this.ordersService.addPart(id, partData);
        } catch (err: any) {
            console.error('[Orders addPart] Error:', err?.message, err?.stack);
            throw err;
        }
    }

    @Delete('parts/:id')
    removePart(@Param('id') id: string) {
        return this.ordersService.removePart(id);
    }

    @Patch('equipment/:id')
    updateEquipment(@Param('id') id: string, @Body() body: any) {
        return this.ordersService.updateEquipment(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.ordersService.remove(id);
    }

    @Get(':id/pdf')
    async downloadPdf(@Param('id') id: string, @Res() res: Response) {
        const order = await this.ordersService.findOne(id);
        const buffer = await this.pdfService.generateOrderPdf(order as any);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="OS-${order.protocol}.pdf"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
}

    @Get(':id/conversation')
    async getConversation(@Param('id') id: string, @Req() req: any) {
        // Apenas admin pode ver a conversa completa
        const role = req.user?.role;
        if (!['admin', 'super_admin'].includes(role)) {
            return { restricted: true, messages: [] };
        }
        await this.conversationService.migrateFromHistory(id);
        return this.conversationService.getConversation(id);
    }
