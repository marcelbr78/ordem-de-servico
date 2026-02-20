import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) { }

    /** Returns whether the Evolution API server is configured (env or DB) */
    @Get('config')
    async getConfig() {
        return this.whatsappService.getConfigStatus();
    }

    @Get('status')
    async getStatus() {
        return this.whatsappService.checkConnectionStatus();
    }

    @Get('qrcode')
    async getQRCode() {
        return this.whatsappService.getQRCode();
    }

    @Post('instance')
    async createInstance(@Body() body: { instanceName: string; number?: string }) {
        return this.whatsappService.createInstance(body.instanceName, body.number);
    }

    @Delete('disconnect')
    async disconnect() {
        return this.whatsappService.disconnectInstance();
    }

    @Post('test')
    async sendTest(@Body() body: { number: string }) {
        return this.whatsappService.sendTestMessage(body.number);
    }
}
