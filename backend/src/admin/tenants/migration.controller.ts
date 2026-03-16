import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@Controller('admin/tenants/migration')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class MigrationController {
    constructor(private readonly dataSource: DataSource) {}

    @Post('execute')
    async executeMigration(@Body() body: { sql: string }) {
        // Warning: This is a powerful tool. Use only for initial setup.
        // It splits the SQL by ';' and executes each statement.
        const statements = body.sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        const results = [];
        for (const statement of statements) {
            try {
                const res = await this.dataSource.query(statement);
                results.push({ statement: statement.substring(0, 50) + '...', status: 'success' });
            } catch (err) {
                results.push({ statement: statement.substring(0, 50) + '...', status: 'error', message: err.message });
            }
        }
        return { total: statements.length, results };
    }
}
