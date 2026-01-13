import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'mssql',
                host: config.get<string>('DB_HOST'),
                port: Number(config.get<string>('DB_PORT')) || 1433,
                username: config.get<string>('DB_USERNAME'),
                password: config.get<string>('DB_PASSWORD'),
                database: config.get<string>('DB_NAME'),
                schema: config.get<string>('DB_SCHEMA') || 'dbo',

                // ✅ Let Nest auto-register entities
                autoLoadEntities: true,

                // 🔴 NEVER enable in production
                synchronize: false,
                logging: false,

                options: {
                    encrypt: true,
                    trustServerCertificate: true,
                    enableAnsiNullDefault: true,
                },

                // 🔥 CRITICAL: prevent MSSQL connection explosion
                pool: {
                    max: 5,
                    min: 1,
                    idleTimeoutMillis: 30000,
                },
            }),
        }),
    ],
})
export class DatabaseModule { }
