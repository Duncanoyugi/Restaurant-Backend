import { MigrationInterface, QueryRunner } from "typeorm";

export class FixDriverAssignmentWorkingHours1765861000000 implements MigrationInterface {
    name = 'FixDriverAssignmentWorkingHours1765861000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure workingHours column is of type ntext (which simple-json uses for MSSQL)
        await queryRunner.query(`ALTER TABLE "driver_assignments" ALTER COLUMN "workingHours" ntext`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No down migration needed
    }
}
