import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SuppliersService {
    constructor(
        @InjectRepository(Supplier)
        private suppliersRepository: Repository<Supplier>,
    ) { }

    create(data: Partial<Supplier>) {
        const supplier = this.suppliersRepository.create(data);
        return this.suppliersRepository.save(supplier);
    }

    findAll() {
        return this.suppliersRepository.find({ order: { name: 'ASC' } });
    }

    findActive() {
        return this.suppliersRepository.find({ where: { active: true } });
    }

    findOne(id: string) {
        return this.suppliersRepository.findOneBy({ id });
    }

    update(id: string, data: Partial<Supplier>) {
        return this.suppliersRepository.update(id, data);
    }

    remove(id: string) {
        return this.suppliersRepository.delete(id);
    }
}
