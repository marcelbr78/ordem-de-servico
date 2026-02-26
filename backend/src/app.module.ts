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
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';
import { BankAccount } from './modules/bank-accounts/entities/bank-account.entity';
import { AuditModule } from './modules/audit/audit.module';
import { User } from './modules/users/entities/user.entity';
import { Client } from './modules/clients/entities/client.entity';
import { ClientContact } from './modules/clients/entities/client-contact.entity';
import { ClientOsHistory } from './modules/clients/entities/client-os-history.entity';
import { OrderService } from './modules/orders/entities/order-service.entity';
import { OrderEquipment } from './modules/orders/entities/order-equipment.entity';
import { OrderHistory } from './modules/orders/entities/order-history.entity';
import { OrderPhoto } from './modules/orders/entities/order-photo.entity';
import { OrderPart } from './modules/orders/entities/order-part.entity';
import { Diagnosis } from './modules/diagnosis/entities/diagnosis.entity';
import { Product } from './modules/inventory/entities/product.entity';
import { StockBalance } from './modules/inventory/entities/stock-balance.entity';
import { StockMovement } from './modules/inventory/entities/stock-movement.entity';
import { Transaction } from './modules/finance/entities/transaction.entity';
import { AuditLog } from './modules/audit/entities/audit-log.entity';

import { SmartPartsModule } from './modules/smartparts/smartparts.module';
import { Supplier } from './modules/smartparts/entities/supplier.entity';
import { Quote } from './modules/smartparts/entities/quote.entity';
import { QuoteResponse } from './modules/smartparts/entities/quote-response.entity';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SystemSetting } from './modules/settings/entities/setting.entity';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { FiscalNota } from './modules/fiscal/entities/fiscal-nota.entity';
import { FiscalProduto } from './modules/fiscal/entities/fiscal-produto.entity';
import { FiscalServico } from './modules/fiscal/entities/fiscal-servico.entity';
import { FiscalCliente } from './modules/fiscal/entities/fiscal-cliente.entity';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
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
                        entities: [User, Client, ClientContact, ClientOsHistory, OrderService, OrderEquipment, OrderHistory, OrderPhoto, OrderPart, Diagnosis, Product, StockBalance, StockMovement, Transaction, AuditLog, Supplier, Quote, QuoteResponse, SystemSetting, BankAccount, FiscalNota, FiscalProduto, FiscalServico, FiscalCliente],
                        synchronize: true, // Em prod real deve ser false com migrations
                        ssl: { rejectUnauthorized: false },
                    };
                }

                return {
                    type: 'sqlite',
                    database: 'database.sqlite',
                    entities: [User, Client, ClientContact, ClientOsHistory, OrderService, OrderEquipment, OrderHistory, OrderPhoto, OrderPart, Diagnosis, Product, StockBalance, StockMovement, Transaction, AuditLog, Supplier, Quote, QuoteResponse, SystemSetting, BankAccount, FiscalNota, FiscalProduto, FiscalServico, FiscalCliente],
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
        BankAccountsModule,
        SmartPartsModule,
        CloudinaryModule,
        SettingsModule,
        FiscalModule,
    ],
})
export class AppModule { }
