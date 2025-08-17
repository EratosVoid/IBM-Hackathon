const { pool } = require("../database");

// User database operations
const getUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
};

const createUser = async (email, password, name) => {
  const result = await pool.query(
    "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *",
    [email, password, name]
  );
  return result.rows[0];
};

// Project database operations
const createProject = async (
  name,
  description,
  cityType,
  constraints,
  userId,
  cityData,
  blueprintWidth = 100,
  blueprintHeight = 100,
  blueprintUnit = "meters"
) => {
  const result = await pool.query(
    "INSERT INTO projects (name, description, city_type, constraints, created_by, city_data, blueprint_width, blueprint_height, blueprint_unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
    [
      name,
      description,
      cityType,
      JSON.stringify(constraints),
      userId,
      JSON.stringify(cityData),
      blueprintWidth,
      blueprintHeight,
      blueprintUnit,
    ]
  );
  return result.rows[0];
};

const getUserProjects = async () => {
  const result = await pool.query(
    "SELECT * FROM projects ORDER BY created_at DESC"
  );
  return result.rows;
};

const getProjectById = async (projectId) => {
  const result = await pool.query("SELECT * FROM projects WHERE id = $1", [
    parseInt(projectId),
  ]);
  return result.rows[0];
};

const getProjectByIdForUser = async (projectId) => {
  const result = await pool.query(
    "SELECT * FROM projects WHERE id = $1",
    [parseInt(projectId)]
  );
  return result.rows[0];
};

const updateProjectCityData = async (projectId, cityData) => {
  await pool.query(
    "UPDATE projects SET city_data = $1 WHERE id = $2",
    [JSON.stringify(cityData), parseInt(projectId)]
  );
};

const updateProjectBlueprint = async (
  projectId,
  blueprintWidth,
  blueprintHeight,
  blueprintUnit
) => {
  const result = await pool.query(
    "UPDATE projects SET blueprint_width = $1, blueprint_height = $2, blueprint_unit = $3 WHERE id = $4 RETURNING *",
    [
      blueprintWidth,
      blueprintHeight,
      blueprintUnit,
      parseInt(projectId),
    ]
  );
  return result.rows[0];
};

const deleteProject = async (projectId) => {
  const result = await pool.query(
    "DELETE FROM projects WHERE id = $1 RETURNING *",
    [projectId]
  );
  return result.rows[0];
};

// Community feedback database operations
const createFeedback = async (
  projectId,
  authorName,
  category,
  rating,
  comment,
  sentiment = 'neutral',
  ipAddress = null
) => {
  const result = await pool.query(
    "INSERT INTO community_feedback (project_id, author_name, category, rating, comment, sentiment, ip_address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [projectId, authorName, category, rating, comment, sentiment, ipAddress]
  );
  return result.rows[0];
};

const getProjectFeedback = async (projectId) => {
  const result = await pool.query(
    "SELECT * FROM community_feedback WHERE project_id = $1 ORDER BY submitted_at DESC",
    [parseInt(projectId)]
  );
  return result.rows;
};

const getFeedbackStats = async (projectId) => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total,
      ROUND(AVG(rating), 1) as avg_rating,
      COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive_count,
      COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative_count,
      COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral_count
    FROM community_feedback 
    WHERE project_id = $1
  `, [parseInt(projectId)]);
  return result.rows[0];
};

module.exports = {
  getUserByEmail,
  createUser,
  createProject,
  getUserProjects,
  getProjectById,
  getProjectByIdForUser,
  updateProjectCityData,
  updateProjectBlueprint,
  deleteProject,
  createFeedback,
  getProjectFeedback,
  getFeedbackStats,
};
