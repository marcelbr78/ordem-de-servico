import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientOsHistory } from './entities/client-os-history.entity';

@Injectable()
export class ClientOsHistoryService {
    constructor(
        @InjectRepository(ClientOsHistory)
        private osHistoryRepository: Repository<ClientOsHistory>,
    ) { }

    async findByClient(clienteId: string): Promise<ClientOsHistory[]> {
        return this.osHistoryRepository.find({
            where: { clienteId },
            order: { dataAbertura: 'DESC' },
        });
    }

    async addRecord(data: Partial<ClientOsHistory>): Promise<ClientOsHistory> {
        const record = this.osHistoryRepository.create(data);
        return this.osHistoryRepository.save(record);
    }

    async updateStatus(osId: string, status: string): Promise<void> {
        await this.osHistoryRepository.update({ osId }, { status });
    }
}
