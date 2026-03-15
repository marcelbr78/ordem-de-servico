import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { OrdersService } from './src/modules/orders/orders.service';
import { DataSource } from 'typeorm';
import { CreateOrderServiceDto } from './src/modules/orders/dto/create-order-service.dto';
import { OSPriority } from './src/modules/orders/entities/order-service.entity';
import * as fs from 'fs';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const ordersService = app.get(OrdersService);
    const dataSource = app.get(DataSource);

    console.log('--- STARTING IMAGE UPLOAD TEST ---');

    try {
        // 0. Fetch Client
        const client = (await dataSource.query('SELECT id FROM clients LIMIT 1'))[0];
        if (!client) throw new Error('No client found');

        // 1. Create Order
        console.log('Creating Order for Image Test...');
        const order = await ordersService.create({
            clientId: client.id,
            technicianId: '00000000-0000-0000-0000-000000000000',
            priority: OSPriority.NORMAL,
            equipments: [{ type: 'ImgTest', brand: 'X', model: 'Y', reportedDefect: 'Z' } as any]
        }, 'system');
        console.log('Order created:', order.id);

        // 2. Mock File (Valid 1x1 GIF)
        const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        const file: any = {
            fieldname: 'file',
            originalname: 'test-image.gif',
            encoding: '7bit',
            mimetype: 'image/gif',
            buffer: buffer,
            size: buffer.length
        };

        // 3. Upload Image
        console.log('Uploading Image...');
        const photo = await ordersService.addPhoto(order.id, file);
        console.log('Photo saved:', photo.id);
        console.log('URL:', photo.url);
        console.log('Public ID:', photo.publicId);

        // 4. Verify in DB
        const savedOrder = await ordersService.findOne(order.id);
        if (savedOrder.photos.length > 0) {
            console.log('✅ Photo found in Order relations');
        } else {
            console.error('❌ Photo NOT found in Order relations');
        }

        // 5. Delete Image
        console.log('Deleting Image...');
        await ordersService.removePhoto(photo.id);
        console.log('Photo deleted');

        // Verify Deletion
        const updatedOrder = await ordersService.findOne(order.id);
        if (updatedOrder.photos.length === 0) {
            console.log('✅ Photo successfully removed from DB');
        } else {
            console.error('❌ Photo still exists in DB');
        }

    } catch (e) {
        console.error('TEST FAILED:', e);
    } finally {
        await app.close();
    }
}

bootstrap();
