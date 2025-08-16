// server.js - Refactored modular version
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { initializeDatabase } = require("./database");

// Import middleware
const { authenticateToken } = require("./middleware/auth");

// Import routes
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const publicProjectRoutes = require("./routes/publicProjects");
const plannerRoutes = require("./routes/planner");
const uploadRoutes = require("./routes/uploads");
const simulationRoutes = require("./routes/simulation");

const app = express();
const PORT = process.env.PORT || 5010;

// Basic middleware
app.use(express.json());
app.use(cors());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "City Planner API",
    timestamp: new Date().toISOString(),
  });
});

// Mount routes - auth routes first (no auth required)
app.use("/api/auth", authRoutes);

// Public project routes (no authentication required) - MUST come before protected routes
app.use("/api/projects/public", publicProjectRoutes);

// Legacy route redirects for backward compatibility (before protected routes)
app.post("/api/init-city", authenticateToken, (req, res, next) => {
  // Delegate to projects route handler
  req.url = "/init-city";
  projectRoutes(req, res, next);
});

app.post("/api/prompt", authenticateToken, (req, res, next) => {
  // Delegate to planner route handler
  req.url = "/prompt";
  plannerRoutes(req, res, next);
});

app.post("/api/upload-blueprint", authenticateToken, (req, res, next) => {
  // Delegate to upload route handler
  req.url = "/blueprint";
  uploadRoutes(req, res, next);
});

// Protected routes (auth middleware applied per route group)
app.use("/api/projects", authenticateToken, projectRoutes);
app.use("/api/planner", authenticateToken, plannerRoutes);
app.use("/api/upload", authenticateToken, uploadRoutes);
app.use("/api/simulation", authenticateToken, simulationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    error: "Something went wrong on the server",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 City Planner API server running on port ${PORT}`);
      console.log(`📊 Database: Connected to Supabase PostgreSQL`);
      console.log(`🔧 Demo credentials:`);
      console.log(`   planner@city.dev / cityplanner123`);
      console.log(`   dev@hackathon.com / cityplanner123`);
      console.log(`🌐 Public routes (no auth required):`);
      console.log(`   GET  /api/projects/public/:projectId (public project data)`);
      console.log(`   POST /api/projects/public/:projectId/feedback (submit feedback)`);
      console.log(`🛡️  Protected routes:`);
      console.log(`   POST /api/projects/init-city (create city project)`);
      console.log(`   POST /api/planner/prompt (AI agent communication)`);
      console.log(`   GET  /api/simulation/:projectId (get simulation data)`);
      console.log(`   POST /api/upload/blueprint (upload blueprint files)`);
      console.log(
        `📁 Modular structure: routes/, services/, middleware/, utils/`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
