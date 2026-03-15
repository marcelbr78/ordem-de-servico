import { DataSource } from 'typeorm';
import { User } from './src/modules/users/entities/user.entity';
import { Client } from './src/modules/clients/entities/client.entity';
import { ClientContact } from './src/modules/clients/entities/client-contact.entity';
import { ClientOsHistory } from './src/modules/clients/entities/client-os-history.entity';
import { OrderService } from './src/modules/orders/entities/order-service.entity';
import { OrderEquipment } from './src/modules/orders/entities/order-equipment.entity';
import { OrderHistory } from './src/modules/orders/entities/order-history.entity';
import { OrderPhoto } from './src/modules/orders/entities/order-photo.entity';
import { Diagnosis } from './src/modules/diagnosis/entities/diagnosis.entity';
import { Product } from './src/modules/inventory/entities/product.entity';
import { Transaction } from './src/modules/finance/entities/transaction.entity';
import { AuditLog } from './src/modules/audit/entities/audit-log.entity';
import { Supplier } from './src/modules/smartparts/entities/supplier.entity';
import { Quote } from './src/modules/smartparts/entities/quote.entity';
import { QuoteResponse } from './src/modules/smartparts/entities/quote-response.entity';

const AppDataSource = new DataSource({
    type: 'sqlite',
    database: 'database.sqlite',
    entities: [User, Client, ClientContact, ClientOsHistory, OrderService, OrderEquipment, OrderHistory, OrderPhoto, Diagnosis, Product, Transaction, AuditLog, Supplier, Quote, QuoteResponse],
    synchronize: false,
});

async function run() {
    try {
        await AppDataSource.initialize();
        const clientCount = await AppDataSource.getRepository(Client).count();
        const orderCount = await AppDataSource.getRepository(OrderService).count();

        console.log('--- DATA COUNTS ---');
        console.log(`Clients: ${clientCount}`);
        console.log(`Orders: ${orderCount}`);
        console.log('-------------------');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

run();
