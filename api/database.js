const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const createTables = async () => {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const projectsTable = `
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      city_type VARCHAR(50) DEFAULT 'new',
      constraints JSONB,
      status VARCHAR(50) DEFAULT 'initialized',
      city_data JSONB,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(usersTable);
    await pool.query(projectsTable);
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

const insertDefaultUsers = async () => {
  const bcrypt = require('bcryptjs');
  
  const users = [
    {
      email: 'planner@city.dev',
      password: await bcrypt.hash('cityplanner123', 10),
      name: 'City Planner'
    },
    {
      email: 'dev@hackathon.com',
      password: await bcrypt.hash('cityplanner123', 10),
      name: 'Hackathon Dev'
    }
  ];

  for (const user of users) {
    try {
      await pool.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
        [user.email, user.password, user.name]
      );
    } catch (error) {
      console.error('Error inserting user:', error);
    }
  }
  console.log('Default users inserted/updated successfully');
};

const initializeDatabase = async () => {
  try {
    await createTables();
    await insertDefaultUsers();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

module.exports = { pool, initializeDatabase };