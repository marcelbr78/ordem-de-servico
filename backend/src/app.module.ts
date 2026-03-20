import { QuotesModule } from './modules/quotes/quotes.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReportsModule } from './modules/orders/reports.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FinanceModule } from './modules/finance/finance.module';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';
import { BankAccount } from './modules/bank-accounts/entities/bank-account.entity';
import { TenantsModule } from './modules/tenants/tenants.module';
import { Tenant } from './modules/tenants/entities/tenant.entity';
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
import { OrderConversation } from './modules/orders/entities/order-conversation.entity';
import { OrderServiceItem } from './modules/orders/entities/order-service-item.entity';
import { SupportTicket, TicketMessage } from './admin/support/support-ticket.entity';
import { Broadcast } from './admin/broadcasts/broadcast.entity';
import { FeatureFlag } from './admin/feature-flags/feature-flag.entity';
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
import { TenantMiddleware } from './modules/tenants/tenant.middleware';
import { Supplier as SupplierRegistry } from './modules/suppliers/entities/supplier.entity';
import { SaasModule as SaasModuleEntity } from './modules/tenants/entities/saas-module.entity';
import { TenantModule as TenantModuleEntity } from './modules/tenants/entities/tenant-module.entity';
import { Plan } from './modules/tenants/entities/plan.entity';
import { Subscription } from './modules/tenants/entities/subscription.entity';
import { EventsModule } from './modules/events/events.module';
import { AdminModule } from './admin/admin.module';
import { SmartDiagnosticsModule } from './modules/smart-diagnostics/smart-diagnostics.module';
import { SmartPricingModule } from './modules/smart-pricing/smart-pricing.module';
import { SmartPartsSuggestionModule } from './modules/smart-parts/smart-parts.module';
import { DiagnosticPattern } from './modules/smart-diagnostics/entities/diagnostic-pattern.entity';
import { RepairPricePattern } from './modules/smart-pricing/entities/repair-price-pattern.entity';
import { PowerSequenceModule } from './modules/power-sequence/power-sequence.module';
import { DiagnosticBoard } from './modules/power-sequence/entities/diagnostic-board.entity';
import { PowerSequenceStep } from './modules/power-sequence/entities/power-sequence-step.entity';
import { PowerSequenceAnalysis } from './modules/power-sequence/entities/power-sequence-analysis.entity';
import { BoardDiagnosisModule } from './modules/board-diagnosis/board-diagnosis.module';
import { Board as BoardDiagnosisBoard } from './modules/board-diagnosis/entities/board.entity';
import { KioskModule } from './modules/kiosk/kiosk.module';
import { SymptomCategory as BoardDiagnosisSymptomCategory } from './modules/board-diagnosis/entities/symptom-category.entity';
import { Circuit as BoardDiagnosisCircuit } from './modules/board-diagnosis/entities/circuit.entity';
import { PowerRail as BoardDiagnosisPowerRail } from './modules/board-diagnosis/entities/power-rail.entity';
import { DiagnosticSession as BoardDiagnosisSession } from './modules/board-diagnosis/entities/diagnostic-session.entity';
import { DiagnosticStep as BoardDiagnosisStep } from './modules/board-diagnosis/entities/diagnostic-step.entity';
import { RepairCase as BoardDiagnosisRepairCase } from './modules/board-diagnosis/entities/repair-case.entity';
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

                const dbUrl = configService.get<string>('DATABASE_URL');

                if (dbUrl || isProduction || configService.get('DB_HOST')) {
                    return {
                        type: 'postgres',
                        url: dbUrl, // Se dbUrl existir, o TypeORM usa ela e ignora o resto
                        host: configService.get<string>('DB_HOST'),
                        port: configService.get<number>('DB_PORT', 5432),
                        username: configService.get<string>('DB_USERNAME'),
                        password: configService.get<string>('DB_PASSWORD'),
                        database: configService.get<string>('DB_DATABASE'),
                        entities: [User, Client, ClientContact, ClientOsHistory, OrderService, OrderEquipment, OrderHistory, OrderPhoto, OrderPart, OrderServiceItem, OrderConversation, Diagnosis, Product, StockBalance, StockMovement, Transaction, AuditLog, Supplier, Quote, QuoteResponse, SystemSetting, BankAccount, FiscalNota, FiscalProduto, FiscalServico, FiscalCliente, Tenant, SaasModuleEntity, TenantModuleEntity, Plan, Subscription, DiagnosticPattern, RepairPricePattern, DiagnosticBoard, PowerSequenceStep, PowerSequenceAnalysis, BoardDiagnosisBoard, BoardDiagnosisSymptomCategory, BoardDiagnosisCircuit, BoardDiagnosisPowerRail, BoardDiagnosisSession, BoardDiagnosisStep, BoardDiagnosisRepairCase, SupportTicket, TicketMessage, Broadcast, FeatureFlag],
                        synchronize: true, // Habilitado para garantir que as tabelas iniciais sejam criadas
                        migrations: ['dist/migrations/*.js'],
                        migrationsRun: true,
                        dropSchema: false,
                        ssl: configService.get<string>('DB_HOST') === 'localhost' ? false : { rejectUnauthorized: false },
                    };
                }

                return {
                    type: 'sqlite',
                    database: 'database.sqlite',
                    entities: [User, Client, ClientContact, ClientOsHistory, OrderService, OrderEquipment, OrderHistory, OrderPhoto, OrderPart, OrderServiceItem, OrderConversation, Diagnosis, Product, StockBalance, StockMovement, Transaction, AuditLog, Supplier, Quote, QuoteResponse, SystemSetting, BankAccount, FiscalNota, FiscalProduto, FiscalServico, FiscalCliente, Tenant, SaasModuleEntity, TenantModuleEntity, Plan, Subscription, DiagnosticPattern, RepairPricePattern, DiagnosticBoard, PowerSequenceStep, PowerSequenceAnalysis, BoardDiagnosisBoard, BoardDiagnosisSymptomCategory, BoardDiagnosisCircuit, BoardDiagnosisPowerRail, BoardDiagnosisSession, BoardDiagnosisStep, BoardDiagnosisRepairCase, SupportTicket, TicketMessage, Broadcast, FeatureFlag],
                    synchronize: false,
                };
            },
        }),
        UsersModule,
        AuthModule,
        AuditModule,
        ClientsModule,
        OrdersModule,
        ReportsModule,
        SuppliersModule,
        DiagnosisModule,
        WhatsappModule,
        InventoryModule,
        FinanceModule,
        CommissionsModule,
        QuotesModule,
        BankAccountsModule,
        SmartPartsModule,
        CloudinaryModule,
        SettingsModule,
        FiscalModule,
        TenantsModule,
        EventsModule,
        AdminModule,
        SmartDiagnosticsModule,
        SmartPricingModule,
        SmartPartsSuggestionModule,
        PowerSequenceModule,
        BoardDiagnosisModule,
        KioskModule,
    ],
})
export class AppModule implements NestModule {
    constructor(private configService: ConfigService) {}

    async onModuleInit() {
        const dbHost = this.configService.get('DB_HOST');
        console.log(`[DB DEBUG] Tentando conexão com o banco em: ${dbHost || 'SQLite Local'}`);
    }

    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(TenantMiddleware)
            .exclude('admin/(.*)', 'kiosk/public/(.*)', 'kiosk/admin/(.*)')
            .forRoutes('*');
    }
}
