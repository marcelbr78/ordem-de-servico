import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantId1742100000000 implements MigrationInterface {
    name = 'AddTenantId1742100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar tenantId em tabelas que ainda não têm
        const alters = [
            `ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "tenantId" character varying`,
            `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "tenantId" character varying`,
            `ALTER TABLE "commissions" ADD COLUMN IF NOT EXISTS "tenantId" character varying`,
        ];
        for (const sql of alters) {
            await queryRunner.query(sql).catch(() => {});
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
