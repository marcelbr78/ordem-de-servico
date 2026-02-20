import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ClientContact, ContactType } from './entities/client-contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
    constructor(
        @InjectRepository(ClientContact)
        private contactsRepository: Repository<ClientContact>,
    ) { }

    async findAllByClient(clienteId: string): Promise<ClientContact[]> {
        return this.contactsRepository.find({
            where: { clienteId },
            order: { principal: 'DESC', createdAt: 'ASC' },
        });
    }

    async create(clienteId: string, dto: CreateContactDto): Promise<ClientContact> {
        // Se marcado como principal, desmarcar outros do mesmo tipo
        if (dto.principal) {
            await this.contactsRepository.update(
                { clienteId, tipo: dto.tipo as unknown as ContactType },
                { principal: false },
            );
        }

        const contact = this.contactsRepository.create({
            ...dto,
            clienteId,
        });

        return this.contactsRepository.save(contact);
    }

    async update(clienteId: string, contactId: string, dto: UpdateContactDto): Promise<ClientContact> {
        const contact = await this.contactsRepository.findOne({
            where: { id: contactId, clienteId },
        });

        if (!contact) {
            throw new NotFoundException('Contato não encontrado');
        }

        // Se marcado como principal, desmarcar outros do mesmo tipo
        if (dto.principal) {
            const tipo = dto.tipo || contact.tipo;
            await this.contactsRepository.update(
                { clienteId, tipo, id: Not(contactId) as any },
                { principal: false },
            );
        }

        const updated = this.contactsRepository.merge(contact, dto);
        return this.contactsRepository.save(updated);
    }

    async remove(clienteId: string, contactId: string): Promise<void> {
        const contact = await this.contactsRepository.findOne({
            where: { id: contactId, clienteId },
        });

        if (!contact) {
            throw new NotFoundException('Contato não encontrado');
        }

        await this.contactsRepository.remove(contact);
    }
}
