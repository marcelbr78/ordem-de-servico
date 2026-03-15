import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { FeatureFlag } from './feature-flag.entity';

const DEFAULT_FLAGS = [
    { key: 'fiscal_module',      name: 'Módulo Fiscal / NF-e',         category: 'billing',      description: 'Emissão de notas fiscais eletrônicas' },
    { key: 'whatsapp_auto',      name: 'WhatsApp Automático',           category: 'integration',  description: 'Notificações automáticas por status' },
    { key: 'smart_diagnostics',  name: 'Diagnóstico Inteligente',       category: 'beta',         description: 'Sugestões de diagnóstico por IA', isBeta: true },
    { key: 'smart_quotes',       name: 'Cotação Automática',            category: 'integration',  description: 'Cotação via WhatsApp com fornecedores' },
    { key: 'kanban_board',       name: 'Kanban de OS',                  category: 'ui',           description: 'Visualização kanban das ordens de serviço' },
    { key: 'warranty_control',   name: 'Controle de Garantia',          category: 'general',      description: 'Gestão de garantias de reparos' },
    { key: 'advanced_reports',   name: 'Relatórios Avançados',          category: 'general',      description: 'Gráficos e métricas de desempenho' },
    { key: 'conversation_audit', name: 'Auditoria de Conversa',         category: 'compliance',   description: 'Histórico de mensagens por OS para admins' },
    { key: 'multi_equipment',    name: 'Multi-Equipamento por OS',      category: 'general',      description: 'Múltiplos equipamentos em uma OS' },
    { key: 'board_diagnostics',  name: 'Diagnóstico de Placa',          category: 'beta',         description: 'Análise avançada de componentes de placa', isBeta: true },
];

@Controller('admin/feature-flags')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class FeatureFlagsController {
    constructor(@InjectRepository(FeatureFlag) private flagRepo: Repository<FeatureFlag>) {}

    @Get()
    async findAll() {
        const existing = await this.flagRepo.find({ order: { category: 'ASC', name: 'ASC' } });
        // Seed defaults if empty
        if (existing.length === 0) {
            for (const d of DEFAULT_FLAGS) {
                const f = this.flagRepo.create({ ...d, enabledGlobally: false });
                await this.flagRepo.save(f).catch(() => {});
            }
            return this.flagRepo.find({ order: { category: 'ASC', name: 'ASC' } });
        }
        return existing;
    }

    @Post()
    create(@Body() body: Partial<FeatureFlag>) {
        return this.flagRepo.save(this.flagRepo.create(body));
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: Partial<FeatureFlag>) {
        await this.flagRepo.update(id, body);
        return this.flagRepo.findOneBy({ id });
    }

    // Check se um tenant tem acesso a uma flag (chamado pelo frontend/tenant)
    @Get('check/:tenantId/:key')
    async check(@Param('tenantId') tenantId: string, @Param('key') key: string) {
        const flag = await this.flagRepo.findOne({ where: { key } });
        if (!flag) return { enabled: true }; // default: habilitado se não configurado

        if (flag.enabledGlobally) return { enabled: true };
        const enabledTenants: string[] = flag.enabledForTenants ? JSON.parse(flag.enabledForTenants) : [];
        const disabledTenants: string[] = flag.disabledForTenants ? JSON.parse(flag.disabledForTenants) : [];

        if (disabledTenants.includes(tenantId)) return { enabled: false };
        if (enabledTenants.includes(tenantId)) return { enabled: true };
        return { enabled: flag.enabledGlobally };
    }
}
