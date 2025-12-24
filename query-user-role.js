const { DataSource } = require('typeorm');
const dotenv = require('dotenv');

dotenv.config();

const dataSource = new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '1433'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  schema: process.env.DB_SCHEMA || 'dbo',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableAnsiNullDefault: true,
  },
});

async function queryUserRole() {
  try {
    await dataSource.initialize();
    console.log('Connected to the database');
    
    const query = `
      SELECT u.id, u.email, r.name as role 
      FROM users u 
      JOIN user_roles r ON u.role_id = r.id 
      WHERE u.id = 5
    `;
    
    const result = await dataSource.query(query);
    console.log('User role:', result);
    
    await dataSource.destroy();
  } catch (error) {
    console.error('Error querying the database:', error);
  }
}

queryUserRole();