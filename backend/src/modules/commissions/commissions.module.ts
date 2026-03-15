import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commission } from './entities/commission.entity';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';
import { OrderService } from '../orders/entities/order-service.entity';
import { User } from '../users/entities/user.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Commission, OrderService, User]),
        SettingsModule,
    ],
    controllers: [CommissionsController],
    providers: [CommissionsService],
    exports: [CommissionsService],
})
export class CommissionsModule {}
