import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1763458855498 implements MigrationInterface {
    name = 'InitialMigration1763458855498'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "otps" ("otp_id" int NOT NULL IDENTITY(1,1), "email" varchar(255) NOT NULL, "otp_code" varchar(10) NOT NULL, "otp_type" varchar(30) NOT NULL, "status" varchar(20) NOT NULL CONSTRAINT "DF_59fb6a727148720e17d26efb165" DEFAULT 'pending', "expires_at" datetime2 NOT NULL, "verified_at" datetime2, "attempts" int NOT NULL CONSTRAINT "DF_9d25a2719652db7d270a8b5c2bf" DEFAULT 0, "created_at" datetime2 NOT NULL CONSTRAINT "DF_8a76ff5161ab826ca96b285cb08" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_beed49055f72629c9dcdb8bdcf9" DEFAULT getdate(), CONSTRAINT "PK_d73db5899adf59583abd31e2309" PRIMARY KEY ("otp_id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" varchar(30) NOT NULL CONSTRAINT "DF_3676155292d72c67cd4e090514f" DEFAULT 'pending_verification'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "DF_3676155292d72c67cd4e090514f"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TABLE "otps"`);
    }

}
