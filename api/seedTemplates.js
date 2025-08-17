const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

// Template file paths
const templateFiles = [
  'smart-downtown-revival.json',
  'sustainable-suburbs.json',
  'industrial-innovation-hub.json',
  'coastal-resort-town.json',
  'metropolitan-grid-blueprint.json'
];

// Load template data from JSON files
const loadTemplate = (filename) => {
  const filePath = path.join(__dirname, 'templates', filename);
  const rawData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(rawData);
};

// Insert demo project into database
const insertTemplateProject = async (templateData) => {
  const { project, city_data } = templateData;
  
  try {
    const insertQuery = `
      INSERT INTO projects (
        name, 
        description, 
        city_type, 
        constraints, 
        city_data,
        blueprint_width,
        blueprint_height,
        blueprint_unit,
        status,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
    `;

    // Get the demo user ID (assuming first user is the demo user)
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userResult.rows[0]?.id || 1;

    const values = [
      project.name,
      project.description,
      project.city_type,
      JSON.stringify(project.constraints),
      JSON.stringify(city_data),
      project.blueprint_width,
      project.blueprint_height,
      project.blueprint_unit,
      'completed', // status
      userId
    ];

    const result = await pool.query(insertQuery, values);
    console.log(`✅ Inserted demo project: ${project.name} (ID: ${result.rows[0].id})`);
    return result.rows[0].id;
  } catch (error) {
    console.error(`❌ Error inserting demo project ${project.name}:`, error.message);
    throw error;
  }
};

// Main seeding function
const seedDemoProjects = async () => {
  console.log('🌱 Starting demo project seeding...\n');

  try {
    // Load and insert each demo project
    for (const filename of templateFiles) {
      console.log(`📁 Loading demo project: ${filename}`);
      const templateData = loadTemplate(filename);
      await insertTemplateProject(templateData);
    }

    console.log('\n🎉 Demo project seeding completed successfully!');
    console.log('\n📊 Demo Projects Summary:');
    console.log('1. Smart Downtown Revival - Urban mixed-use development');
    console.log('2. Sustainable Suburbs - Eco-friendly residential community');
    console.log('3. Industrial Innovation Hub - Advanced manufacturing district');
    console.log('4. Coastal Resort Town - Sustainable tourism destination');
    console.log('5. Metropolitan Grid Blueprint - Professional engineering blueprint');

    // Display demo project statistics
    const statsQuery = `
      SELECT 
        name,
        city_type,
        blueprint_width || 'x' || blueprint_height || ' ' || blueprint_unit as dimensions,
        status
      FROM projects 
      WHERE name IN ('Smart Downtown Revival', 'Sustainable Suburbs', 'Industrial Innovation Hub', 'Coastal Resort Town', 'Metropolitan Grid Development')
      ORDER BY created_at;
    `;

    const statsResult = await pool.query(statsQuery);
    console.log('\n📈 Demo Project Statistics:');
    statsResult.rows.forEach(row => {
      console.log(`   ${row.name}: ${row.dimensions}, Type: ${row.city_type}, Status: ${row.status}`);
    });

  } catch (error) {
    console.error('💥 Demo project seeding failed:', error);
    process.exit(1);
  }
};


// Run seeding if this file is executed directly
if (require.main === module) {
  seedDemoProjects()
    .then(() => {
      console.log('\n🔚 Seeding process completed. Database connection will close.');
      pool.end();
    })
    .catch((error) => {
      console.error('Fatal error during seeding:', error);
      pool.end();
      process.exit(1);
    });
}

module.exports = {
  seedDemoProjects,
  loadTemplate
};