import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) { }

    /** Returns whether the Evolution API server is configured (env or DB) */
    @Get('config')
    async getConfig(@Request() req) {
        return this.whatsappService.getConfigStatus(req.user?.tenantId);
    }

    @Get('status')
    async getStatus(@Request() req) {
        return this.whatsappService.checkConnectionStatus(req.user?.tenantId);
    }

    @Get('qrcode')
    async getQRCode(@Request() req) {
        return this.whatsappService.getQRCode(req.user?.tenantId);
    }

    @Post('instance')
    async createInstance(@Request() req) {
        return this.whatsappService.createInstance(req.user?.tenantId);
    }

    @Post('reset')
    async reset(@Request() req) {
        return this.whatsappService.resetInstance(req.user?.tenantId);
    }

    @Delete('disconnect')
    async disconnect(@Request() req) {
        return this.whatsappService.disconnectInstance(req.user?.tenantId);
    }

    @Post('test')
    async sendTest(@Body() body: { number: string }, @Request() req) {
        return this.whatsappService.sendTestMessage(body.number, req.user?.tenantId);
    }
}
