import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { StockService } from './src/modules/inventory/stock.service';
import { OrdersService } from './src/modules/orders/orders.service';
import { CreateOrderServiceDto } from './src/modules/orders/dto/create-order-service.dto';
import { OSStatus, OSPriority } from './src/modules/orders/entities/order-service.entity';
import { DataSource } from 'typeorm';
import { OrderPart } from './src/modules/orders/entities/order-part.entity';
import { Product } from './src/modules/inventory/entities/product.entity';
import { StockBalance } from './src/modules/inventory/entities/stock-balance.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const stockService = app.get(StockService);
    const ordersService = app.get(OrdersService);
    const dataSource = app.get(DataSource);

    console.log('--- STARTING STOCK TEST ---');

    try {
        // 0. Fetch Client
        const client = (await dataSource.query('SELECT id FROM clients LIMIT 1'))[0];
        if (!client) throw new Error('No clients found. Please seed at least one client.');
        console.log('Using Client:', client.id);

        // 1. Create Product
        console.log('Creating Product...');
        const productRepo = dataSource.getRepository(Product);
        const product = productRepo.create({
            name: 'Test Part ' + Date.now(),
            sku: 'TEST-' + Date.now(),
            priceCost: 50,
            priceSell: 100
        });
        await productRepo.save(product);
        console.log('Product created:', product.id);

        // 2. Add Initial Stock (Restock OS)
        console.log('Adding Stock...');
        const restockOrder = await ordersService.create({
            clientId: client.id,
            technicianId: '00000000-0000-0000-0000-000000000000',
            priority: OSPriority.NORMAL,
            equipments: [{ type: 'Restock', brand: 'N/A', model: 'N/A', reportedDefect: 'N/A' } as any]
        }, 'system');

        await stockService.addStock(restockOrder.id, [{
            productId: product.id,
            quantity: 10,
            cost: 50
        }]);

        const balanceRepo = dataSource.getRepository(StockBalance);
        let balance = await balanceRepo.findOne({ where: { productId: product.id } });
        console.log('Stock Balance after Entry:', balance?.quantity); // Expected: 10

        // 3. Create Main OS
        console.log('Creating Main Order...');
        const orderDto = new CreateOrderServiceDto();
        orderDto.clientId = client.id;
        orderDto.technicianId = '00000000-0000-0000-0000-000000000000';
        orderDto.priority = OSPriority.NORMAL;
        orderDto.equipments = [{ type: 'Test', brand: 'Test', model: 'Test', reportedDefect: 'Test' } as any];

        const order = await ordersService.create(orderDto, 'system');
        console.log('Order created:', order.id);

        // 4. Add Part to Order
        console.log('Adding Part to Order...');
        const partRepo = dataSource.getRepository(OrderPart);
        const part = partRepo.create({
            orderId: order.id,
            productId: product.id,
            quantity: 2,
            unitPrice: 100,
            unitCost: 50
        });
        await partRepo.save(part);

        // 5. Finalize Order
        console.log('Finalizing Order...');
        await ordersService.changeStatus(order.id, { status: OSStatus.EM_DIAGNOSTICO, comments: 'GOTO Diagnostico' });
        await ordersService.changeStatus(order.id, { status: OSStatus.AGUARDANDO_APROVACAO, comments: 'GOTO Aprovacao' });
        await ordersService.changeStatus(order.id, { status: OSStatus.EM_REPARO, comments: 'GOTO Reparo' });
        await ordersService.changeStatus(order.id, { status: OSStatus.TESTES, comments: 'Testes OK' });
        await ordersService.changeStatus(order.id, { status: OSStatus.FINALIZADA, comments: 'Finalizado' });

        balance = await balanceRepo.findOne({ where: { productId: product.id } });
        console.log('Stock Balance after Finalize:', balance?.quantity); // Expected: 8

        // 6. Cancel Order
        console.log('Cancelling Order...');

        // Correct Flow: FINALIZADA -> EM_REPARO -> AGUARDANDO_PECA -> AGUARDANDO_APROVACAO -> CANCELADA
        await ordersService.changeStatus(order.id, { status: OSStatus.EM_REPARO, comments: 'Reaberto' });
        await ordersService.changeStatus(order.id, { status: OSStatus.AGUARDANDO_PECA, comments: '...' });
        await ordersService.changeStatus(order.id, { status: OSStatus.AGUARDANDO_APROVACAO, comments: '...' });
        await ordersService.changeStatus(order.id, { status: OSStatus.CANCELADA, comments: 'Cancelado' });

        balance = await balanceRepo.findOne({ where: { productId: product.id } });
        console.log('Stock Balance after Cancel:', balance?.quantity); // Expected: 10

    } catch (e) {
        console.error('TEST FAILED:', e);
        process.exit(1);
    } finally {
        await app.close();
    }
}

bootstrap();
