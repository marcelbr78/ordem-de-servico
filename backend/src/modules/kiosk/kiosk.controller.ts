import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { KioskService } from './kiosk.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('kiosk/public')
export class KioskController {
    constructor(private readonly kioskService: KioskService) {}

    /** Retorna dados da loja pelo subdomain — sem autenticação */
    @Get(':slug')
    async getConfig(@Param('slug') slug: string) {
        return this.kioskService.getTenantConfig(slug);
    }

    /** Busca cliente pelo telefone no tenant */
    @Post(':slug/identify')
    async identify(
        @Param('slug') slug: string,
        @Body() body: { telefone: string },
    ) {
        const tenant = await this.kioskService.getTenantConfig(slug);
        return this.kioskService.identifyClient(tenant.id, body.telefone);
    }

    /** Cria cliente (se novo) + OS — retorna protocolo */
    @Post(':slug/open-os')
    async openOS(
        @Param('slug') slug: string,
        @Body() body: {
            nome: string;
            telefone: string;
            clientId?: string;
            equipType: string;
            equipBrand: string;
            equipModel: string;
            problem: string;
        },
    ) {
        return this.kioskService.openOS(slug, body);
    }
}

/** Endpoints de gestão — somente master admin (requer JWT) */
@Controller('kiosk/admin')
@UseGuards(JwtAuthGuard)
export class KioskAdminController {
    constructor(private readonly kioskService: KioskService) {}

    /** Lista todos os tenants com status do kiosk */
    @Get('tenants')
    async listTenants() {
        return this.kioskService.listTenantsKioskStatus();
    }

    /** Habilita ou desabilita kiosk para um tenant */
    @Patch('tenants/:tenantId')
    async setEnabled(
        @Param('tenantId') tenantId: string,
        @Body() body: { enabled: boolean },
    ) {
        return this.kioskService.setKioskEnabled(tenantId, body.enabled);
    }
}
