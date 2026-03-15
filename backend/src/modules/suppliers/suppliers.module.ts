import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity';
import { SuppliersController } from './suppliers.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Supplier])],
    controllers: [SuppliersController],
    exports: [TypeOrmModule],
})
export class SuppliersModule {}
