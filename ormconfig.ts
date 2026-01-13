import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 1433,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  schema: process.env.DB_SCHEMA || 'dbo',

  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],

  synchronize: false,
  logging: false,

  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
});
