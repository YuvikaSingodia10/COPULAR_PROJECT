require('dotenv').config();
const mysql = require('mysql2/promise');

async function alter() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hireblind'
    });
    await connection.query('ALTER TABLE candidates MODIFY candidate_code VARCHAR(50)');
    await connection.query('ALTER TABLE audit_logs MODIFY candidate_code VARCHAR(50)');
    console.log('Tables altered successfully');
    await connection.end();
  } catch (err) {
    console.error('Error altering tables:', err);
  }
}
alter();
