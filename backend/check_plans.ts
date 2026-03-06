
import { createConnection } from 'typeorm';
import { Plan } from './src/modules/tenants/entities/plan.entity';

async function check() {
    try {
        const connection = await createConnection({
            type: 'sqlite',
            database: 'database.sqlite',
            entities: [Plan],
        });
        const plans = await connection.getRepository(Plan).find();
        console.log('PLANS IN DB:', plans);
        await connection.close();
    } catch (e) {
        console.error('ERROR CHECKING PLANS:', e);
    }
}
check();
