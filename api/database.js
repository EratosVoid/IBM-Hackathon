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
      blueprint_width INTEGER DEFAULT 100,
      blueprint_height INTEGER DEFAULT 100,
      blueprint_unit VARCHAR(20) DEFAULT 'meters',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const feedbackTable = `
    CREATE TABLE IF NOT EXISTS community_feedback (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      author_name VARCHAR(255) DEFAULT 'Anonymous',
      category VARCHAR(50) NOT NULL CHECK (category IN ('Planning', 'Infrastructure', 'Environment', 'Community')),
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      sentiment VARCHAR(20) DEFAULT 'neutral',
      ip_address INET,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(usersTable);
    await pool.query(projectsTable);
    await pool.query(feedbackTable);
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

const insertDemoProjects = async () => {
  try {
    console.log('🌱 Checking for demo projects...');
    
    // Check if demo projects already exist
    const demoCheck = await pool.query(
      `SELECT COUNT(*) as count FROM projects 
       WHERE name IN ('Smart Downtown Revival', 'Sustainable Suburbs', 'Industrial Innovation Hub', 'Coastal Resort Town', 'Metropolitan Grid Development')`
    );
    
    if (demoCheck.rows[0].count > 0) {
      console.log('📚 Demo projects already exist, skipping insertion');
      return;
    }
    
    // Import and run demo project seeding
    const { seedDemoProjects } = require('./seedTemplates');
    await seedDemoProjects();
    console.log('✅ Demo projects inserted successfully');
  } catch (error) {
    console.error('⚠️  Demo project insertion failed, but continuing:', error.message);
    // Don't fail the entire initialization if demo projects fail
  }
};

const initializeDatabase = async () => {
  try {
    await createTables();
    await insertDefaultUsers();
    await insertDemoProjects();
    console.log('🎉 Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

module.exports = { pool, initializeDatabase };