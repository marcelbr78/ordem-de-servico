
import { DataSource } from 'typeorm';
import { OrderService } from './backend/src/modules/orders/entities/order-service.entity';
import { Client } from './backend/src/modules/clients/entities/client.entity';
import * as dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function verify() {
    console.log('🔍 Iniciando verificação do sistema...');

    const ds = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'ordem_servico',
        entities: [OrderService, Client, 'backend/src/**/*.entity.ts'],
        synchronize: false,
    });

    try {
        await ds.initialize();
        console.log('✅ Banco de Dados: CONECTADO');

        const clientCount = await ds.manager.count(Client);
        console.log(`📊 Clientes encontrados: ${clientCount}`);

        const orderCount = await ds.manager.count(OrderService);
        console.log(`📊 Ordens de Serviço encontradas: ${orderCount}`);

        if (orderCount === 0) {
            console.log('⚠️ Aviso: Nenhuma OS no banco (Normal se for novo, mas explica a tela vazia)');
        }

        await ds.destroy();
        console.log('✅ Verificação concluída com sucesso.');
        process.exit(0);
    } catch (err) {
        console.error('❌ ERRO CRÍTICO:', err);
        process.exit(1);
    }
}

verify();
