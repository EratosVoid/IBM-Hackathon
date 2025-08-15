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
  cityData
) => {
  const result = await pool.query(
    "INSERT INTO projects (name, description, city_type, constraints, created_by, city_data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [
      name,
      description,
      cityType,
      JSON.stringify(constraints),
      userId,
      JSON.stringify(cityData),
    ]
  );
  return result.rows[0];
};

const getUserProjects = async (userId) => {
  const result = await pool.query(
    "SELECT * FROM projects WHERE created_by = $1 ORDER BY created_at DESC",
    [userId]
  );
  return result.rows;
};

const getProjectById = async (projectId, userId) => {
  const result = await pool.query(
    "SELECT * FROM projects WHERE id = $1 AND created_by = $2",
    [parseInt(projectId), userId]
  );
  return result.rows[0];
};

const updateProjectCityData = async (projectId, userId, cityData) => {
  await pool.query(
    "UPDATE projects SET city_data = $1 WHERE id = $2 AND created_by = $3",
    [JSON.stringify(cityData), parseInt(projectId), userId]
  );
};

const deleteProject = async (projectId, userId) => {
  const result = await pool.query(
    "DELETE FROM projects WHERE id = $1 AND created_by = $2 RETURNING *",
    [projectId, userId]
  );
  return result.rows[0];
};

module.exports = {
  getUserByEmail,
  createUser,
  createProject,
  getUserProjects,
  getProjectById,
  updateProjectCityData,
  deleteProject,
};