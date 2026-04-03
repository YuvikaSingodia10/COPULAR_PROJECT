const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hireblind',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'hireblind'}\``
  );
  await connection.end();

  const db = await pool.getConnection();

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'recruiter') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS job_descriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) DEFAULT 'Untitled Position',
      skills TEXT NOT NULL,
      min_experience INT NOT NULL,
      role_keywords TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_code VARCHAR(50) NOT NULL,
      resume_text LONGTEXT,
      score INT DEFAULT 0,
      confidence_score DECIMAL(5,2) DEFAULT 0.00,
      status ENUM('pending', 'shortlisted', 'accepted', 'rejected') DEFAULT 'pending',
      explanation JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(255) NOT NULL,
      candidate_code VARCHAR(50),
      details TEXT,
      performed_by INT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS interviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_code VARCHAR(50) NOT NULL,
      interview_date DATE NOT NULL,
      interview_time TIME NOT NULL,
      status ENUM('scheduled', 'confirmed', 'completed', 'cancelled') DEFAULT 'scheduled',
      notes TEXT,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS overrides (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_code VARCHAR(50) NOT NULL,
      original_rank INT NOT NULL,
      new_rank INT NOT NULL,
      justification TEXT NOT NULL,
      performed_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Alter existing tables to add new columns if they don't exist
  try {
    await db.query(`ALTER TABLE candidates ADD COLUMN confidence_score DECIMAL(5,2) DEFAULT 0.00`);
  } catch (e) { /* column may already exist */ }

  try {
    await db.query(`ALTER TABLE candidates ADD COLUMN status ENUM('pending', 'shortlisted', 'accepted', 'rejected') DEFAULT 'pending'`);
  } catch (e) { /* column may already exist */ }

  try {
    await db.query(`ALTER TABLE audit_logs ADD COLUMN details TEXT`);
  } catch (e) { /* column may already exist */ }

  try {
    await db.query(`ALTER TABLE job_descriptions ADD COLUMN title VARCHAR(255) DEFAULT 'Untitled Position'`);
  } catch (e) { /* column may already exist */ }

  try {
    await db.query(`ALTER TABLE job_descriptions ADD COLUMN role_keywords TEXT`);
  } catch (e) { /* column may already exist */ }

  db.release();
  console.log('Database initialized successfully');
}

module.exports = { pool, initializeDatabase };
