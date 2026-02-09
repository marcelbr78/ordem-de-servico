import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(Client)
        private clientsRepository: Repository<Client>,
    ) { }

    async create(createClientDto: CreateClientDto): Promise<Client> {
        const existingClient = await this.clientsRepository.findOne({
            where: { whatsapp: createClientDto.whatsapp },
        });

        if (existingClient) {
            throw new ConflictException('Já existe um cliente cadastrado com este WhatsApp');
        }

        const client = this.clientsRepository.create(createClientDto);
        return this.clientsRepository.save(client);
    }

    async findAll(): Promise<Client[]> {
        return this.clientsRepository.find({ order: { name: 'ASC' } });
    }

    async findOne(id: string): Promise<Client> {
        const client = await this.clientsRepository.findOne({ where: { id } });
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

    async remove(id: string): Promise<void> {
        const client = await this.findOne(id);
        await this.clientsRepository.remove(client);
    }

    async findByWhatsapp(whatsapp: string): Promise<Client | undefined> {
        return this.clientsRepository.findOne({ where: { whatsapp } });
    }
}
