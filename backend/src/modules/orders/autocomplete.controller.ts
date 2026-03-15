import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { OrderEquipment } from './entities/order-equipment.entity';
import { OrderService } from './entities/order-service.entity';
import { Client } from '../clients/entities/client.entity';

@Controller('autocomplete')
@UseGuards(JwtAuthGuard)
export class AutocompleteController {
    constructor(
        @InjectRepository(OrderEquipment) private equipRepo: Repository<OrderEquipment>,
        @InjectRepository(OrderService) private orderRepo: Repository<OrderService>,
        @InjectRepository(Client) private clientRepo: Repository<Client>,
    ) {}

    // ── Marcas conhecidas + histórico do tenant ────────────────
    @Get('brands')
    async getBrands(@Req() req: any, @Query('q') q: string) {
        const tenantId = req.user?.tenantId;
        const KNOWN_BRANDS = [
            'Samsung', 'Apple', 'Motorola', 'Xiaomi', 'LG', 'Sony', 'Nokia',
            'Huawei', 'ASUS', 'Lenovo', 'Acer', 'Dell', 'HP', 'Positivo',
            'Multilaser', 'TCL', 'Philips', 'Panasonic', 'JBL', 'Nintendo',
            'Intelbras', 'Mondial', 'Britânia', 'Consul', 'Brastemp',
        ];
        // Marcas já usadas pelo tenant
        const qb = this.equipRepo.createQueryBuilder('eq')
            .select('DISTINCT eq.brand', 'brand')
            .where('eq.brand IS NOT NULL')
            .andWhere('eq.brand != :empty', { empty: '' });
        if (tenantId) qb.andWhere('eq.orderId IN (SELECT id FROM order_services WHERE "tenantId" = :tid)', { tid: tenantId });
        if (q) qb.andWhere('LOWER(eq.brand) LIKE LOWER(:q)', { q: `${q.toLowerCase()}%` });
        const fromDb = await qb.limit(20).getRawMany().catch(() => []);
        const dbBrands = fromDb.map((r: any) => r.brand).filter(Boolean);

        const filtered = q
            ? KNOWN_BRANDS.filter(b => b.toLowerCase().startsWith(q.toLowerCase()))
            : KNOWN_BRANDS;

        const merged = [...new Set([...dbBrands, ...filtered])].slice(0, 15);
        return merged.map(b => ({ value: b, source: dbBrands.includes(b) ? 'history' : 'known' }));
    }

    // ── Modelos por marca ──────────────────────────────────────
    @Get('models')
    async getModels(@Req() req: any, @Query('brand') brand: string, @Query('q') q: string) {
        if (!brand) return [];
        const tenantId = req.user?.tenantId;

        // Modelos conhecidos por marca
        const KNOWN_MODELS: Record<string, string[]> = {
            Samsung: ['Galaxy A15','Galaxy A25','Galaxy A35','Galaxy A55','Galaxy S23','Galaxy S24','Galaxy S24 Ultra','Galaxy A54','Galaxy A34','Galaxy M54','Galaxy J7','Galaxy A10','Galaxy A20','Galaxy A30'],
            Apple:   ['iPhone 11','iPhone 12','iPhone 13','iPhone 14','iPhone 15','iPhone SE','iPad Air','iPad Pro','MacBook Air','MacBook Pro'],
            Motorola:['Moto G14','Moto G24','Moto G34','Moto G54','Moto G84','Moto G Power','Moto G Play','Moto Edge 40','Moto E13','Moto E22'],
            Xiaomi:  ['Redmi Note 12','Redmi Note 13','Redmi 12','Redmi 13C','POCO M5','POCO X5','Xiaomi 13T','Xiaomi 14'],
            LG:      ['K22','K52','K62','K92','Velvet','Wing','Q60','K31'],
            Sony:    ['Xperia 1 V','Xperia 5 V','Xperia 10 V','Xperia 1 IV'],
        };

        const known = (KNOWN_MODELS[brand] || []).filter(m => !q || m.toLowerCase().includes(q.toLowerCase()));

        const qb = this.equipRepo.createQueryBuilder('eq')
            .select('DISTINCT eq.model', 'model')
            .where('LOWER(eq.brand) = LOWER(:brand)', { brand })
            .andWhere('eq.model IS NOT NULL')
            .andWhere('eq.model != :empty', { empty: '' });
        if (q) qb.andWhere('LOWER(eq.model) LIKE LOWER(:q)', { q: `%${q.toLowerCase()}%` });
        if (tenantId) qb.andWhere('eq.orderId IN (SELECT id FROM order_services WHERE "tenantId" = :tid)', { tid: tenantId });

        const fromDb = await qb.limit(20).getRawMany().catch(() => []);
        const dbModels = fromDb.map((r: any) => r.model).filter(Boolean);

        const merged = [...new Set([...dbModels, ...known])].slice(0, 15);
        return merged.map(m => ({ value: m, source: dbModels.includes(m) ? 'history' : 'known' }));
    }

    // ── Tipos de equipamento ───────────────────────────────────
    @Get('equipment-types')
    async getTypes(@Query('q') q: string) {
        const TYPES = ['Celular','Smartphone','Notebook','Computador','Tablet','Smart TV','Console','Câmera','Monitor','Impressora','Roteador','Smart Watch','Fone de Ouvido','Caixa de Som','Drone'];
        const filtered = q ? TYPES.filter(t => t.toLowerCase().includes(q.toLowerCase())) : TYPES;
        return filtered.map(t => ({ value: t }));
    }

    // ── Sintomas / defeitos reportados ─────────────────────────
    @Get('symptoms')
    async getSymptoms(@Req() req: any, @Query('q') q: string, @Query('brand') brand?: string, @Query('model') model?: string) {
        const tenantId = req.user?.tenantId;
        const COMMON = [
            'Tela quebrada','Tela preta sem imagem','Tela com listras','Touch não funciona',
            'Não liga','Liga e desliga sozinho','Não carrega','Carrega devagar',
            'Bateria dura pouco','Superaquece','Câmera não funciona','Câmera fosca/embaçada',
            'Sem sinal/sem rede','Wi-Fi não conecta','Bluetooth com problema',
            'Caixa de som sem som','Microfone com problema','Conector de carga frouxo',
            'Botão de volume com problema','Botão home com problema','Tela manchada',
            'Placa molhada/dano por líquido','Sistema travando','Não reconhece chip',
            'Senha esquecida (FRP)','Bateria inchada',
        ];

        const qb = this.orderRepo.createQueryBuilder('o')
            .select('DISTINCT o.reportedDefect', 'symptom')
            .where('o.reportedDefect IS NOT NULL')
            .andWhere('o.reportedDefect != :empty', { empty: '' });
        if (tenantId) qb.andWhere('o.tenantId = :tenantId', { tenantId });
        if (brand || model) qb.innerJoin('o.equipments', 'eq');
        if (brand) qb.andWhere('LOWER(eq.brand) = LOWER(:brand)', { brand });
        if (model) qb.andWhere('LOWER(eq.model) = LOWER(:model)', { model });
        if (q) qb.andWhere('LOWER(o.reportedDefect) LIKE LOWER(:q)', { q: `%${q.toLowerCase()}%` });

        const fromDb = await qb.limit(20).getRawMany().catch(() => []);
        const dbSymptoms = fromDb.map((r: any) => r.symptom).filter(Boolean);

        const filtered = q ? COMMON.filter(s => s.toLowerCase().includes(q.toLowerCase())) : COMMON;
        const merged = [...new Set([...dbSymptoms, ...filtered])].slice(0, 12);
        return merged.map(s => ({ value: s, source: dbSymptoms.includes(s) ? 'history' : 'common' }));
    }

    // ── Diagnósticos do histórico ──────────────────────────────
    @Get('diagnoses')
    async getDiagnoses(@Req() req: any, @Query('q') q: string, @Query('model') model?: string, @Query('symptom') symptom?: string) {
        const tenantId = req.user?.tenantId;
        const qb = this.orderRepo.createQueryBuilder('o')
            .select('DISTINCT o.diagnosis', 'diagnosis')
            .where('o.diagnosis IS NOT NULL')
            .andWhere('o.diagnosis != :empty', { empty: '' });
        if (tenantId) qb.andWhere('o.tenantId = :tenantId', { tenantId });
        if (model) { qb.innerJoin('o.equipments', 'eq').andWhere('LOWER(eq.model) = LOWER(:model)', { model }); }
        if (symptom) qb.andWhere('LOWER(o.reportedDefect) LIKE LOWER(:s)', { s: `%${symptom.toLowerCase()}%` });
        if (q) qb.andWhere('LOWER(o.diagnosis) LIKE LOWER(:q)', { q: `%${q.toLowerCase()}%` });

        const rows = await qb.limit(10).getRawMany().catch(() => []);
        return rows.map((r: any) => ({ value: r.diagnosis })).filter((r: any) => r.value);
    }

    // ── Clientes para busca rápida ─────────────────────────────
    @Get('clients')
    async searchClients(@Req() req: any, @Query('q') q: string) {
        if (!q || q.length < 2) return [];
        const tenantId = req.user?.tenantId;
        const qb = this.clientRepo.createQueryBuilder('c')
            .where('(LOWER(c.nome) LIKE LOWER(:q) OR c.cpfCnpj LIKE :q2)')
            .setParameters({ q: `%${q.toLowerCase()}%`, q2: `%${q}%` })
            .limit(8);
        if (tenantId) qb.andWhere('c.tenantId = :tenantId', { tenantId });
        const rows = await qb.getMany().catch(() => []);
        return rows.map((c: any) => ({ id: c.id, nome: c.nome, cpfCnpj: c.cpfCnpj, phone: c.contatos?.[0]?.numero }));
    }
}
