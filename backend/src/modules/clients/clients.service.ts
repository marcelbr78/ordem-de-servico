import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not, IsNull } from 'typeorm';
import { Client, ClientStatus } from './entities/client.entity';
import { ClientOsHistory } from './entities/client-os-history.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(Client)
        private clientsRepository: Repository<Client>,
        @InjectRepository(ClientOsHistory)
        private osHistoryRepository: Repository<ClientOsHistory>,
    ) { }

    private cleanCpfCnpj(value: string): string {
        return value.replace(/\D/g, '');
    }

    private maskCpfCnpj(value: string): string {
        if (!value) return '';
        const cleaned = this.cleanCpfCnpj(value);
        if (cleaned.length === 11) {
            // CPF: ***.***.***-XX (mostra apenas últimos 2 dígitos)
            return `***.${cleaned.substring(3, 6)}.***-${cleaned.substring(9)}`;
        }
        if (cleaned.length === 14) {
            // CNPJ: **.***.***/**XX-XX (mostra apenas últimos 4 + dígitos)
            return `**.***.***/****-${cleaned.substring(12)}`;
        }
        return '***';
    }

    async create(createClientDto: CreateClientDto): Promise<Client> {
        const cleaned = this.cleanCpfCnpj(createClientDto.cpfCnpj);

        // Validar cruzamento tipo x documento
        if (createClientDto.tipo === 'PF' && cleaned.length !== 11) {
            throw new BadRequestException('Pessoa Física deve ter CPF com 11 dígitos');
        }
        if (createClientDto.tipo === 'PJ' && cleaned.length !== 14) {
            throw new BadRequestException('Pessoa Jurídica deve ter CNPJ com 14 dígitos');
        }

        // Verificar duplicidade (inclui soft-deleted)
        const existing = await this.clientsRepository.findOne({
            where: { cpfCnpj: cleaned },
            withDeleted: true,
        });

        if (existing) {
            throw new ConflictException('Já existe um cliente cadastrado com este CPF/CNPJ');
        }

        // Extrair contatos (serão criados via cascade)
        const { contatos: contatosDto, ...clientData } = createClientDto;

        const client = this.clientsRepository.create({
            ...clientData,
            cpfCnpj: cleaned,
            contatos: contatosDto || [],
        });

        return this.clientsRepository.save(client);
    }

    async findAll(search?: string, tipo?: string, status?: string): Promise<any[]> {
        const queryBuilder = this.clientsRepository
            .createQueryBuilder('client')
            .leftJoinAndSelect('client.contatos', 'contato')
            .orderBy('client.nome', 'ASC');

        if (search) {
            queryBuilder.andWhere(
                '(client.nome LIKE :search OR client.cpfCnpj LIKE :search OR client.nomeFantasia LIKE :search)',
                { search: `%${search}%` },
            );
        }

        if (tipo && (tipo === 'PF' || tipo === 'PJ')) {
            queryBuilder.andWhere('client.tipo = :tipo', { tipo });
        }

        if (status && (status === 'ativo' || status === 'inativo')) {
            queryBuilder.andWhere('client.status = :status', { status });
        }

        const clients = await queryBuilder.getMany();

        // Mascarar CPF/CNPJ na listagem (LGPD)
        return clients.map((client) => ({
            ...client,
            cpfCnpjMasked: this.maskCpfCnpj(client.cpfCnpj),
        }));
    }

    async findOne(id: string): Promise<Client> {
        const client = await this.clientsRepository.findOne({
            where: { id },
            relations: ['contatos', 'osHistorico'],
        });

        if (!client) {
            throw new NotFoundException('Cliente não encontrado');
        }

        return client;
    }

    async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
        const client = await this.findOne(id);
        const updatedClient = this.clientsRepository.merge(client, updateClientDto);
        return this.clientsRepository.save(updatedClient);
    }

    async softDelete(id: string): Promise<void> {
        const client = await this.findOne(id);
        client.status = ClientStatus.INATIVO;
        await this.clientsRepository.save(client);
        await this.clientsRepository.softDelete(id);
    }

    async reactivate(id: string): Promise<Client> {
        await this.clientsRepository.restore(id);
        const client = await this.clientsRepository.findOne({
            where: { id },
        });
        if (!client) {
            throw new NotFoundException('Cliente não encontrado');
        }
        client.status = ClientStatus.ATIVO;
        return this.clientsRepository.save(client);
    }

    async findByDocument(cpfCnpj: string): Promise<Client | undefined> {
        const cleaned = this.cleanCpfCnpj(cpfCnpj);
        return this.clientsRepository.findOne({
            where: { cpfCnpj: cleaned },
        }) as Promise<Client | undefined>;
    }

    async hasLinkedOS(clientId: string): Promise<boolean> {
        const count = await this.osHistoryRepository.count({
            where: { clienteId: clientId },
        });
        return count > 0;
    }
}
