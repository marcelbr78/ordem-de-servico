import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Client } from '../clients/entities/client.entity';
import { ClientContact, ContactType } from '../clients/entities/client-contact.entity';
import { OrderService, OSStatus, OSPriority } from '../orders/entities/order-service.entity';
import { OrderEquipment } from '../orders/entities/order-equipment.entity';
import { OrderHistory, HistoryActionType } from '../orders/entities/order-history.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class KioskService {
    constructor(
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        @InjectRepository(Client) private clientRepo: Repository<Client>,
        @InjectRepository(ClientContact) private contactRepo: Repository<ClientContact>,
        @InjectRepository(User) private userRepo: Repository<User>,
        private dataSource: DataSource,
    ) {}

    async getTenantConfig(slug: string) {
        const tenant = await this.tenantRepo.findOne({
            where: { subdomain: slug, isActive: true },
        });
        if (!tenant) throw new NotFoundException('Loja não encontrada ou inativa');
        return {
            id: tenant.id,
            storeName: tenant.storeName || tenant.name,
            subdomain: tenant.subdomain,
        };
    }

    async identifyClient(tenantId: string, telefone: string) {
        const cleanPhone = telefone.replace(/\D/g, '');
        // Match by last 8 digits — works with any formatting (47)99999-9999 or 47999999999
        const last8 = cleanPhone.slice(-8);

        const contact = await this.contactRepo
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.client', 'client')
            .where('client.tenantId = :tenantId', { tenantId })
            .andWhere('c.numero LIKE :phone', { phone: `%${last8}%` })
            .andWhere('client.deletedAt IS NULL')
            .getOne();

        if (contact?.client) {
            return { found: true, clientId: contact.client.id, nome: contact.client.nome };
        }
        return { found: false };
    }

    async openOS(slug: string, data: {
        nome: string;
        telefone: string;
        clientId?: string;
        equipType: string;
        equipBrand: string;
        equipModel: string;
        problem: string;
    }) {
        const tenant = await this.tenantRepo.findOne({
            where: { subdomain: slug, isActive: true },
        });
        if (!tenant) throw new NotFoundException('Loja não encontrada');

        // Find first active admin user of the tenant for technicianId
        const adminUser = await this.userRepo.findOne({
            where: { tenantId: tenant.id, isActive: true },
        });
        if (!adminUser) throw new NotFoundException('Nenhum usuário ativo encontrado');

        return this.dataSource.transaction(async (manager) => {
            let clientId = data.clientId;

            if (!clientId) {
                // Create new client
                const client = manager.create(Client, {
                    tenantId: tenant.id,
                    nome: data.nome,
                    observacoes: 'Cadastrado via Kiosk de autoatendimento.',
                });
                const saved = await manager.save(client);
                clientId = saved.id;

                // Save phone as WhatsApp contact
                const contact = manager.create(ClientContact, {
                    clienteId: clientId,
                    tipo: ContactType.WHATSAPP,
                    numero: data.telefone.replace(/\D/g, ''),
                    principal: true,
                });
                await manager.save(contact);
            }

            // Generate protocol (same logic as orders service)
            const date = new Date();
            const prefix = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const lastOrder = await manager.findOne(OrderService, {
                where: { protocol: Like(`${prefix}-%`) },
                order: { protocol: 'DESC' },
                withDeleted: true,
            });
            let sequence = 1;
            if (lastOrder?.protocol) {
                const parts = lastOrder.protocol.split('-');
                if (parts.length === 2) {
                    const last = parseInt(parts[1], 10);
                    if (!isNaN(last)) sequence = last + 1;
                }
            }
            const protocol = `${prefix}-${sequence.toString().padStart(4, '0')}`;

            // Create Order
            const order = manager.create(OrderService, {
                tenantId: tenant.id,
                protocol,
                clientId,
                technicianId: adminUser.id,
                status: OSStatus.ABERTA,
                priority: OSPriority.NORMAL,
                reportedDefect: data.problem,
            });
            const savedOrder = await manager.save(order);

            // Create Equipment
            const equipment = manager.create(OrderEquipment, {
                orderId: savedOrder.id,
                isMain: true,
                type: data.equipType,
                brand: data.equipBrand,
                model: data.equipModel,
                reportedDefect: data.problem,
            });
            await manager.save(equipment);

            // Create History entry
            const history = manager.create(OrderHistory, {
                tenantId: tenant.id,
                orderId: savedOrder.id,
                actionType: HistoryActionType.SYSTEM,
                newStatus: OSStatus.ABERTA,
                comments: `OS aberta via Kiosk. Equipamento: ${data.equipBrand} ${data.equipModel}. Defeito: ${data.problem}`,
                userId: adminUser.id,
            });
            await manager.save(history);

            return { protocol, orderId: savedOrder.id };
        });
    }
}
