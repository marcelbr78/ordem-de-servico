import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { SchedulerController } from './scheduler.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Appointment])],
    controllers: [SchedulerController],
    exports: [TypeOrmModule],
})
export class SchedulerModule {}
