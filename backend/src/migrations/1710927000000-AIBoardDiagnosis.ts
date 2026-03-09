import { MigrationInterface, QueryRunner } from "typeorm";

export class AIBoardDiagnosis1710927000000 implements MigrationInterface {
    name = 'AIBoardDiagnosis1710927000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create table board_diagnosis_boards
        await queryRunner.query(`
            CREATE TABLE "board_diagnosis_boards" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "model" character varying NOT NULL,
                "manufacturer" character varying NOT NULL,
                "schematic_file" character varying,
                "boardview_file" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_board_diagnosis_boards" PRIMARY KEY ("id")
            )
        `);

        // Create table board_diagnosis_symptom_categories
        await queryRunner.query(`
            CREATE TABLE "board_diagnosis_symptom_categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_board_diagnosis_symptom_categories" PRIMARY KEY ("id")
            )
        `);

        // Create table board_diagnosis_circuits
        await queryRunner.query(`
            CREATE TABLE "board_diagnosis_circuits" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "board_id" uuid NOT NULL,
                "name" character varying NOT NULL,
                "type" character varying NOT NULL,
                "description" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_board_diagnosis_circuits" PRIMARY KEY ("id")
            )
        `);

        // Create table board_diagnosis_power_rails
        await queryRunner.query(`
            CREATE TABLE "board_diagnosis_power_rails" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "board_id" uuid NOT NULL,
                "circuit_id" uuid NOT NULL,
                "name" character varying NOT NULL,
                "voltage_nominal" numeric(10,2),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_board_diagnosis_power_rails" PRIMARY KEY ("id")
            )
        `);

        // Create table board_diagnosis_sessions
        await queryRunner.query(`
            CREATE TABLE "board_diagnosis_sessions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" character varying,
                "board_id" uuid NOT NULL,
                "technician_id" character varying,
                "symptom_category_id" uuid,
                "active_circuit_id" uuid,
                "symptom_description" text,
                "charger_current" numeric(10,3),
                "bench_current" numeric(10,3),
                "power_button_current" numeric(10,3),
                "status" character varying NOT NULL DEFAULT 'active',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_board_diagnosis_sessions" PRIMARY KEY ("id")
            )
        `);

        // Create table board_diagnosis_steps
        await queryRunner.query(`
            CREATE TABLE "board_diagnosis_steps" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "session_id" uuid NOT NULL,
                "step_number" integer NOT NULL,
                "question" character varying NOT NULL,
                "measurement_type" character varying,
                "expected_range" character varying,
                "measurement" text,
                "result" character varying,
                "next_step_if_ok" character varying,
                "next_step_if_fail" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_board_diagnosis_steps" PRIMARY KEY ("id")
            )
        `);

        // Create table board_diagnosis_repair_cases
        await queryRunner.query(`
            CREATE TABLE "board_diagnosis_repair_cases" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenantId" character varying,
                "board_id" uuid NOT NULL,
                "symptom_category_id" uuid,
                "symptom" text,
                "measurements_summary" jsonb,
                "circuit_id" uuid,
                "defective_component" character varying,
                "repair_action" text,
                "success" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_board_diagnosis_repair_cases" PRIMARY KEY ("id")
            )
        `);

        // FKs for board_diagnosis_circuits
        await queryRunner.query(`ALTER TABLE "board_diagnosis_circuits" ADD CONSTRAINT "FK_board_id_circuits" FOREIGN KEY ("board_id") REFERENCES "board_diagnosis_boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // FKs for board_diagnosis_power_rails
        await queryRunner.query(`ALTER TABLE "board_diagnosis_power_rails" ADD CONSTRAINT "FK_board_id_rails" FOREIGN KEY ("board_id") REFERENCES "board_diagnosis_boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "board_diagnosis_power_rails" ADD CONSTRAINT "FK_circuit_id_rails" FOREIGN KEY ("circuit_id") REFERENCES "board_diagnosis_circuits"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // FKs for board_diagnosis_sessions
        await queryRunner.query(`ALTER TABLE "board_diagnosis_sessions" ADD CONSTRAINT "FK_board_id_sessions" FOREIGN KEY ("board_id") REFERENCES "board_diagnosis_boards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "board_diagnosis_sessions" ADD CONSTRAINT "FK_symptom_cat_sessions" FOREIGN KEY ("symptom_category_id") REFERENCES "board_diagnosis_symptom_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "board_diagnosis_sessions" ADD CONSTRAINT "FK_active_circuit_sessions" FOREIGN KEY ("active_circuit_id") REFERENCES "board_diagnosis_circuits"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // FKs for board_diagnosis_steps
        await queryRunner.query(`ALTER TABLE "board_diagnosis_steps" ADD CONSTRAINT "FK_session_id_steps" FOREIGN KEY ("session_id") REFERENCES "board_diagnosis_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // FKs for board_diagnosis_repair_cases
        await queryRunner.query(`ALTER TABLE "board_diagnosis_repair_cases" ADD CONSTRAINT "FK_board_id_repairs" FOREIGN KEY ("board_id") REFERENCES "board_diagnosis_boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "board_diagnosis_repair_cases" ADD CONSTRAINT "FK_symptom_cat_repairs" FOREIGN KEY ("symptom_category_id") REFERENCES "board_diagnosis_symptom_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "board_diagnosis_repair_cases" ADD CONSTRAINT "FK_circuit_id_repairs" FOREIGN KEY ("circuit_id") REFERENCES "board_diagnosis_circuits"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop FKs
        await queryRunner.query(`ALTER TABLE "board_diagnosis_repair_cases" DROP CONSTRAINT "FK_circuit_id_repairs"`);
        await queryRunner.query(`ALTER TABLE "board_diagnosis_repair_cases" DROP CONSTRAINT "FK_symptom_cat_repairs"`);
        await queryRunner.query(`ALTER TABLE "board_diagnosis_repair_cases" DROP CONSTRAINT "FK_board_id_repairs"`);

        await queryRunner.query(`ALTER TABLE "board_diagnosis_steps" DROP CONSTRAINT "FK_session_id_steps"`);

        await queryRunner.query(`ALTER TABLE "board_diagnosis_sessions" DROP CONSTRAINT "FK_active_circuit_sessions"`);
        await queryRunner.query(`ALTER TABLE "board_diagnosis_sessions" DROP CONSTRAINT "FK_symptom_cat_sessions"`);
        await queryRunner.query(`ALTER TABLE "board_diagnosis_sessions" DROP CONSTRAINT "FK_board_id_sessions"`);

        await queryRunner.query(`ALTER TABLE "board_diagnosis_power_rails" DROP CONSTRAINT "FK_circuit_id_rails"`);
        await queryRunner.query(`ALTER TABLE "board_diagnosis_power_rails" DROP CONSTRAINT "FK_board_id_rails"`);

        await queryRunner.query(`ALTER TABLE "board_diagnosis_circuits" DROP CONSTRAINT "FK_board_id_circuits"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "board_diagnosis_repair_cases"`);
        await queryRunner.query(`DROP TABLE "board_diagnosis_steps"`);
        await queryRunner.query(`DROP TABLE "board_diagnosis_sessions"`);
        await queryRunner.query(`DROP TABLE "board_diagnosis_power_rails"`);
        await queryRunner.query(`DROP TABLE "board_diagnosis_circuits"`);
        await queryRunner.query(`DROP TABLE "board_diagnosis_symptom_categories"`);
        await queryRunner.query(`DROP TABLE "board_diagnosis_boards"`);
    }
}
