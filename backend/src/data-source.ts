import { DataSource } from 'typeorm';
import { config } from 'dotenv';
config();

// Data source para uso pelo TypeORM CLI (migrations)
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'os4u',
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
    ssl: process.env.DB_SSL === 'false' || process.env.DB_HOST === 'postgres' ? false : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
});
