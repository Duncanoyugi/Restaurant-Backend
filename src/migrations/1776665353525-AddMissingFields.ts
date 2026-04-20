import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingFields1776665353525 implements MigrationInterface {
    name = 'AddMissingFields1776665353525'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "room" ADD "amenities" text`);
        await queryRunner.query(`ALTER TABLE "room" ADD "features" text`);
        await queryRunner.query(`ALTER TABLE "menu_item" ADD "preparation_time" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "menu_item" ADD "average_rating" numeric(3,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "menu_item" ADD "total_reviews" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "menu_item" ADD "calories" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "otps" ADD "attempts" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN "attempts"`);
        await queryRunner.query(`ALTER TABLE "menu_item" DROP COLUMN "calories"`);
        await queryRunner.query(`ALTER TABLE "menu_item" DROP COLUMN "total_reviews"`);
        await queryRunner.query(`ALTER TABLE "menu_item" DROP COLUMN "average_rating"`);
        await queryRunner.query(`ALTER TABLE "menu_item" DROP COLUMN "preparation_time"`);
        await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "features"`);
        await queryRunner.query(`ALTER TABLE "room" DROP COLUMN "amenities"`);
    }

}
