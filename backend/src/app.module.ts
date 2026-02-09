import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AuditModule } from './modules/audit/audit.module';
import { User } from './modules/users/entities/user.entity';
import { Client } from './modules/clients/entities/client.entity';
import { OrderService } from './modules/orders/entities/order-service.entity';
import { Diagnosis } from './modules/diagnosis/entities/diagnosis.entity';
import { Product } from './modules/inventory/entities/product.entity';
import { Transaction } from './modules/finance/entities/transaction.entity';
import { AuditLog } from './modules/audit/entities/audit-log.entity';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const isProduction = configService.get('NODE_ENV') === 'production';

                if (isProduction || configService.get('DB_HOST')) {
                    return {
                        type: 'postgres',
                        host: configService.get<string>('DB_HOST'),
                        port: configService.get<number>('DB_PORT', 5432),
                        username: configService.get<string>('DB_USERNAME'),
                        password: configService.get<string>('DB_PASSWORD'),
                        database: configService.get<string>('DB_DATABASE'),
                        entities: [User, Client, OrderService, Diagnosis, Product, Transaction, AuditLog],
                        synchronize: true, // Em prod real deve ser false com migrations
                        ssl: { rejectUnauthorized: false },
                    };
                }

                return {
                    type: 'sqlite',
                    database: 'database.sqlite',
                    entities: [User, Client, OrderService, Diagnosis, Product, Transaction, AuditLog],
                    synchronize: true,
                };
            },
        }),
        UsersModule,
        AuthModule,
        AuditModule,
        ClientsModule,
        OrdersModule,
        DiagnosisModule,
        WhatsappModule,
        InventoryModule,
        FinanceModule,
    ],
})
export class AppModule { }
