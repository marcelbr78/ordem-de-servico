import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, UseInterceptors, UploadedFile, Delete, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { CreateOrderServiceDto } from './dto/create-order-service.dto';
import { UpdateOrderServiceDto } from './dto/update-order-service.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    create(@Body() createOrderDto: CreateOrderServiceDto, @Req() req) {
        return this.ordersService.create(createOrderDto, req.user?.id);
    }

    @Get()
    findAll(@Query('deleted') deleted?: string) {
        return this.ordersService.findAll(deleted === 'true');
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Get('client/:id')
    findByClient(@Param('id') id: string) {
        return this.ordersService.findByClient(id);
    }

    @Patch(':id/status')
    changeStatus(
        @Param('id') id: string,
        @Body() changeStatusDto: ChangeStatusDto,
        @Req() req
    ) {
        return this.ordersService.changeStatus(id, changeStatusDto, req.user?.id);
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
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.ordersService.remove(id);
    }
}
