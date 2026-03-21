import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('public-wa')
export class PublicWaController {
    @Get('ping-evolution')
    async pingEvolution() {
        const axios = require('axios');
        try {
            const res = await axios.get('https://evolution.os4u.com.br', { timeout: 10000 });
            return { success: true, status: res.status, data: res.data };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    @Get('test-create-instance')
    async testCreateInstance() {
        const axios = require('axios');
        try {
            await axios.post('https://evolution.os4u.com.br/instance/create', 
                { instanceName: 'os4u-ping-test', integration: 'WHATSAPP-BAILEYS', qrcode: true },
                { headers: { apikey: 'bluetv_evolution_key_2026', 'Content-Type': 'application/json' }, timeout: 20000 }
            );
            const connectRes = await axios.get(
                `https://evolution.os4u.com.br/instance/connect/os4u-ping-test`,
                { headers: { apikey: 'bluetv_evolution_key_2026' }, timeout: 10000, validateStatus: () => true }
            );
            return { success: true, status: connectRes.status, type: typeof connectRes.data, sample: String(connectRes.data).substring(0, 100) };
        } catch (e) {
            return { success: false, error: e.message, status: e.response?.status };
        }
    }
}

@Controller('wa')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) { }

    /** Returns whether the Evolution API server is configured (env or DB) */
    @Get('config')
    async getConfig(@Request() req) {
        return this.whatsappService.getConfigStatus(req.user?.tenantId);
    }

    @Get('handshake')
    async getStatus(@Request() req) {
        return this.whatsappService.checkConnectionStatus(req.user?.tenantId);
    }

    @Get('qrcode')
    async getQRCode(@Request() req) {
        return this.whatsappService.getQRCode(req.user?.tenantId);
    }

    @Post('initialize')
    async createInstance(@Request() req) {
        try {
            const result = await this.whatsappService.createInstance(req.user?.tenantId);
            return result || { success: false, error: 'Empty result' };
        } catch (e) {
            console.error('FATAL CRASH PREVENTED:', e);
            return { success: false, error: 'CRASH_PREVENTED: ' + (e?.message || 'unknown') };
        }
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
