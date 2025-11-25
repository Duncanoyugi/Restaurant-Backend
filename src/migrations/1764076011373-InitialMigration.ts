import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1764076011373 implements MigrationInterface {
    name = 'InitialMigration1764076011373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "country" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_bf6e37c231c4f4ea56dcd887269" DEFAULT NEWSEQUENTIALID(), "name" varchar(100) NOT NULL, "iso3" varchar(3) NOT NULL, "iso2" varchar(2) NOT NULL, "phone_code" varchar(10), "currency" varchar(10), "created_at" datetime2 NOT NULL CONSTRAINT "DF_750c3d29ca1322c5d4c94ba1638" DEFAULT getdate(), CONSTRAINT "UQ_8df5b1a0131e8e155381547aa5b" UNIQUE ("iso3"), CONSTRAINT "UQ_b49a3cfa4a8ab50b388f893cd4c" UNIQUE ("iso2"), CONSTRAINT "PK_bf6e37c231c4f4ea56dcd887269" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_behavior" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_5a7cd6d00de0e036b185f6a23eb" DEFAULT NEWSEQUENTIALID(), "user_id" uniqueidentifier NOT NULL, "session_date" date NOT NULL, "session_id" varchar(50) NOT NULL, "page_views" int NOT NULL, "menu_views" int NOT NULL, "restaurant_views" int NOT NULL, "items_added_to_cart" int NOT NULL, "checkout_attempts" int NOT NULL, "completed_orders" int NOT NULL, "reservation_attempts" int NOT NULL, "completed_reservations" int NOT NULL, "room_booking_attempts" int NOT NULL, "completed_room_bookings" int NOT NULL, "session_duration_seconds" int NOT NULL, "device_type" varchar(50), "browser" varchar(50), "platform" varchar(50), "created_at" datetime2 NOT NULL CONSTRAINT "DF_a2aed8b915d2c3ddf6acd933f9c" DEFAULT getdate(), CONSTRAINT "PK_5a7cd6d00de0e036b185f6a23eb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dc5c5ce5901245af0baff0d20b" ON "user_behavior" ("session_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_e6ffc42dd1f62d01a1bf609627" ON "user_behavior" ("user_id", "session_date") `);
        await queryRunner.query(`CREATE TABLE "business_metrics" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_0e0b099eef5add99fc9467bc5fe" DEFAULT NEWSEQUENTIALID(), "restaurant_id" uniqueidentifier, "date" date NOT NULL, "total_revenue" decimal(12,2) NOT NULL, "online_revenue" decimal(12,2) NOT NULL, "dine_in_revenue" decimal(12,2) NOT NULL, "delivery_revenue" decimal(12,2) NOT NULL, "total_orders" int NOT NULL, "online_orders" int NOT NULL, "dine_in_orders" int NOT NULL, "delivery_orders" int NOT NULL, "average_order_value" decimal(8,2) NOT NULL, "new_customers" int NOT NULL, "returning_customers" int NOT NULL, "customer_satisfaction_score" decimal(5,2) NOT NULL, "total_reservations" int NOT NULL, "confirmed_reservations" int NOT NULL, "cancelled_reservations" int NOT NULL, "reservation_utilization_rate" decimal(5,2) NOT NULL, "total_room_bookings" int NOT NULL, "occupied_rooms" int NOT NULL, "occupancy_rate" decimal(5,2) NOT NULL, "top_selling_items" nvarchar(255), "low_performing_items" nvarchar(255), "total_preparation_time_minutes" int NOT NULL, "average_preparation_time_minutes" int NOT NULL, "total_delivery_time_minutes" int NOT NULL, "average_delivery_time_minutes" int NOT NULL, "created_at" datetime2 NOT NULL CONSTRAINT "DF_2263c4d61b60593fd7d70247174" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_94e18dc451e3f2be721ac8c394e" DEFAULT getdate(), CONSTRAINT "PK_0e0b099eef5add99fc9467bc5fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2b1205412935e9808d67db525f" ON "business_metrics" ("date") `);
        await queryRunner.query(`CREATE INDEX "IDX_bce0c6633d28494d9a8bc56cd0" ON "business_metrics" ("restaurant_id", "date") `);
        await queryRunner.query(`CREATE TABLE "otps" ("otp_id" int NOT NULL IDENTITY(1,1), "email" varchar(255) NOT NULL, "otp_code" varchar(10) NOT NULL, "otp_type" varchar(30) NOT NULL, "status" varchar(20) NOT NULL CONSTRAINT "DF_59fb6a727148720e17d26efb165" DEFAULT 'pending', "expires_at" datetime2 NOT NULL, "verified_at" datetime2, "attempts" int NOT NULL CONSTRAINT "DF_9d25a2719652db7d270a8b5c2bf" DEFAULT 0, "created_at" datetime2 NOT NULL CONSTRAINT "DF_8a76ff5161ab826ca96b285cb08" DEFAULT getdate(), "updated_at" datetime2 NOT NULL CONSTRAINT "DF_beed49055f72629c9dcdb8bdcf9" DEFAULT getdate(), CONSTRAINT "PK_d73db5899adf59583abd31e2309" PRIMARY KEY ("otp_id"))`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "DF_c62fbe823d612cc7ad7b5c3dd9e"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "DF_85f257e9212fe12ca6307db4c33"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "read"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "data"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD "customer_email" varchar(255)`);
        await queryRunner.query(`ALTER TABLE "payment" ADD "customer_name" varchar(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" varchar(30) NOT NULL CONSTRAINT "DF_3676155292d72c67cd4e090514f" DEFAULT 'pending_verification'`);
        await queryRunner.query(`ALTER TABLE "state" ADD "country_id" uniqueidentifier NOT NULL`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD "session_id" varchar(50)`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "priority" varchar(20) NOT NULL CONSTRAINT "DF_a515f32bb83b17b24dae6406d58" DEFAULT 'medium'`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "metadata" nvarchar(255)`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "channel" varchar(50) NOT NULL CONSTRAINT "DF_38df41b04132b0a08a949b493aa" DEFAULT 'in_app'`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "is_read" bit NOT NULL CONSTRAINT "DF_aedc307c7e60ecb138e3f90ff8e" DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "is_sent" bit NOT NULL CONSTRAINT "DF_95d28817f678ae36afd1e5881a5" DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "scheduled_for" datetime`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "expires_at" datetime`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "action_url" varchar(255)`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "action_label" varchar(100)`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "updated_at" datetime2 NOT NULL CONSTRAINT "DF_e13cf12d6a05407dbac647761c4" DEFAULT getdate()`);
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "DF_1fe3212a0fc1e58f4760f5da8c9"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD CONSTRAINT "DF_1fe3212a0fc1e58f4760f5da8c9" DEFAULT 'card' FOR "method"`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP COLUMN "old_values"`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD "old_values" nvarchar(255)`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP COLUMN "new_values"`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD "new_values" nvarchar(255)`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "type" varchar(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "title" varchar(255) NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_13f3cf247b11fa7fa38be36f01" ON "activity_log" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_959edb8257ad43d7cb2f8d095e" ON "activity_log" ("action", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_6ce8924c20fe5e65d1bf282f51" ON "notification" ("is_read", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_12a9a4259cea86d02b12fe93d6" ON "notification" ("type", "created_at") `);
        await queryRunner.query(`ALTER TABLE "state" ADD CONSTRAINT "FK_dd19065b0813dbffd8170ea6753" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_behavior" ADD CONSTRAINT "FK_f906368b51143310b721aa4c833" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_behavior" DROP CONSTRAINT "FK_f906368b51143310b721aa4c833"`);
        await queryRunner.query(`ALTER TABLE "state" DROP CONSTRAINT "FK_dd19065b0813dbffd8170ea6753"`);
        await queryRunner.query(`DROP INDEX "IDX_12a9a4259cea86d02b12fe93d6" ON "notification"`);
        await queryRunner.query(`DROP INDEX "IDX_6ce8924c20fe5e65d1bf282f51" ON "notification"`);
        await queryRunner.query(`DROP INDEX "IDX_959edb8257ad43d7cb2f8d095e" ON "activity_log"`);
        await queryRunner.query(`DROP INDEX "IDX_13f3cf247b11fa7fa38be36f01" ON "activity_log"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "title" varchar(200) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "type" varchar(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP COLUMN "new_values"`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD "new_values" ntext`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP COLUMN "old_values"`);
        await queryRunner.query(`ALTER TABLE "activity_log" ADD "old_values" ntext`);
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "DF_1fe3212a0fc1e58f4760f5da8c9"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD CONSTRAINT "DF_1fe3212a0fc1e58f4760f5da8c9" DEFAULT 'Paystack' FOR "method"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "DF_e13cf12d6a05407dbac647761c4"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "action_label"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "action_url"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "expires_at"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "scheduled_for"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "DF_95d28817f678ae36afd1e5881a5"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "is_sent"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "DF_aedc307c7e60ecb138e3f90ff8e"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "is_read"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "DF_38df41b04132b0a08a949b493aa"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "channel"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "DF_a515f32bb83b17b24dae6406d58"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "priority"`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP COLUMN "session_id"`);
        await queryRunner.query(`ALTER TABLE "activity_log" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "state" DROP COLUMN "country_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "DF_3676155292d72c67cd4e090514f"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "customer_name"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "customer_email"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "data" nvarchar(255)`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "category" varchar(50)`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "read" bit NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "DF_85f257e9212fe12ca6307db4c33" DEFAULT 0 FOR "read"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "status" varchar(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "DF_c62fbe823d612cc7ad7b5c3dd9e" DEFAULT 'Pending' FOR "status"`);
        await queryRunner.query(`DROP TABLE "otps"`);
        await queryRunner.query(`DROP INDEX "IDX_bce0c6633d28494d9a8bc56cd0" ON "business_metrics"`);
        await queryRunner.query(`DROP INDEX "IDX_2b1205412935e9808d67db525f" ON "business_metrics"`);
        await queryRunner.query(`DROP TABLE "business_metrics"`);
        await queryRunner.query(`DROP INDEX "IDX_e6ffc42dd1f62d01a1bf609627" ON "user_behavior"`);
        await queryRunner.query(`DROP INDEX "IDX_dc5c5ce5901245af0baff0d20b" ON "user_behavior"`);
        await queryRunner.query(`DROP TABLE "user_behavior"`);
        await queryRunner.query(`DROP TABLE "country"`);
    }

}
